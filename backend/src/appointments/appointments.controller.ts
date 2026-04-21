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
import { AppointmentsService } from './appointments.service'
import {
  createAppointmentSchema,
  CreateAppointmentDto,
  updateAppointmentStatusSchema,
  UpdateAppointmentStatusDto,
} from './appointment.schema'

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  getAll(@Query('businessId') businessId: string) {
    if (!businessId) {
      throw new BadRequestException('businessId é obrigatório')
    }
    return this.appointmentsService.getAll(businessId)
  }

  @Get('financial/monthly')
  getMonthlyRevenue(@Query('businessId') businessId: string, @Query('month') month?: string) {
    if (!businessId) {
      throw new BadRequestException('businessId é obrigatório')
    }

    return this.appointmentsService.getMonthlyRevenue(businessId, month)
  }

  @Post()
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
