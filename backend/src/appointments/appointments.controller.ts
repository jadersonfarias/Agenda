import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { parsePaginationParams } from '../common/pagination'
import { AppointmentsService } from './appointments.service'
import {
  customerAppointmentsLookupSchema,
  createAppointmentSchema,
  CreateAppointmentDto,
  publicAppointmentTokenSchema,
  updateAppointmentStatusSchema,
  UpdateAppointmentStatusDto,
} from './appointment.schema'
import { RateLimit } from '../common/rate-limit.decorator'

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('customer')
  getByCustomerPhone(@Query('phone') phone: string) {
    const parseResult = customerAppointmentsLookupSchema.safeParse({ phone })
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.appointmentsService.getByCustomerPhone(parseResult.data)
  }

  @Get()
  getAll(
    @Query('businessId') businessId: string,
    @Query('statusFilter') statusFilter?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string
  ) {
    if (!businessId) {
      throw new BadRequestException('businessId é obrigatório')
    }

    const allowedFilters = ['active', 'completed', 'all'] as const
    const parsedFilter = statusFilter === undefined ? 'all' : (statusFilter as typeof allowedFilters[number])

    if (statusFilter !== undefined && !allowedFilters.includes(parsedFilter)) {
      throw new BadRequestException('statusFilter inválido')
    }

    const pagination = parsePaginationParams(page, perPage)

    return this.appointmentsService.getAll(businessId, parsedFilter, pagination)
  }

  @Get('financial/monthly')
  getMonthlyRevenue(@Query('businessId') businessId: string, @Query('month') month?: string) {
    if (!businessId) {
      throw new BadRequestException('businessId é obrigatório')
    }

    return this.appointmentsService.getMonthlyRevenue(businessId, month)
  }

  @Get('public/:token')
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
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro ao criar agendamento')
    }
  }

  @Patch('public/:token/cancel')
  cancelPublicAppointment(@Param('token') token: string) {
    const parseResult = publicAppointmentTokenSchema.safeParse({ token })
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.appointmentsService.cancelPublicAppointment(parseResult.data)
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: unknown, @Query('businessId') businessId: string) {
    if (!businessId) {
      throw new BadRequestException('businessId é obrigatório')
    }
    const parseResult = updateAppointmentStatusSchema.safeParse(body)
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }
    return this.appointmentsService.updateStatus(id, businessId, parseResult.data)
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Query('businessId') businessId: string) {
    if (!businessId) {
      throw new BadRequestException('businessId é obrigatório')
    }
    try {
      return await this.appointmentsService.delete(id, businessId)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro ao excluir agendamento')
    }
  }
}
