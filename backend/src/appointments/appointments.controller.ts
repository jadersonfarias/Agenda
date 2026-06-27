import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  BadRequestException,
  HttpException,
} from '@nestjs/common'
import { AppointmentsService } from './appointments.service'
import {
  customerAppointmentsLookupSchema,
  createAppointmentSchema,
  publicAppointmentTokenSchema,
} from './appointment.schema'
import { RateLimit } from '../common/rate-limit.decorator'

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('customer')
  @RateLimit({
    key: 'appointments-customer-lookup',
    limit: 10,
    windowMs: 60_000,
    message: 'Muitas consultas de agendamentos. Tente novamente em instantes.',
  })
  getByCustomerPhone(@Query('phone') phone: string, @Query('businessId') businessId?: string) {
    const parseResult = customerAppointmentsLookupSchema.safeParse({ phone, businessId })
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.appointmentsService.getByCustomerPhone(parseResult.data)
  }

  @Get('public/:token')
  @RateLimit({
    key: 'appointments-public-detail',
    limit: 20,
    windowMs: 60_000,
    message: 'Muitas consultas do agendamento. Tente novamente em instantes.',
  })
  getPublicByToken(@Param('token') token: string) {
    const parseResult = publicAppointmentTokenSchema.safeParse({ token })
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.appointmentsService.getPublicByToken(parseResult.data)
  }

  @Post()
  @RateLimit({
    key: 'appointments-create',
    limit: 10,
    windowMs: 60_000,
    message: 'Muitas tentativas de agendamento. Tente novamente em instantes.',
  })
  async create(@Body() body: unknown) {
    const parseResult = createAppointmentSchema.safeParse(body)
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    try {
      return await this.appointmentsService.create(parseResult.data)
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro ao criar agendamento')
    }
  }

  @Patch('public/:token/cancel')
  @RateLimit({
    key: 'appointments-public-cancel',
    limit: 5,
    windowMs: 60_000,
    message: 'Muitas tentativas de cancelamento. Tente novamente em instantes.',
  })
  cancelPublicAppointment(@Param('token') token: string) {
    const parseResult = publicAppointmentTokenSchema.safeParse({ token })
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.appointmentsService.cancelPublicAppointment(parseResult.data)
  }
}
