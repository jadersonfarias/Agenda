import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { AppointmentStatus } from '@prisma/client'
import { AppointmentsRepository } from './appointments.repository'
import { BusinessesRepository } from '../businesses/businesses.repository'
import { BusinessesService } from '../businesses/businesses.service'
import { TimezoneService } from '../scheduling/timezone.service'
import { PaginationParams, PaginatedResult } from '../common/pagination'
import {
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
} from './appointment.schema'

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly businessesRepository: BusinessesRepository,
    private readonly businessesService: BusinessesService,
    private readonly timezoneService: TimezoneService
  ) {}

  private normalizeMonth(month?: string) {
    const currentDate = new Date()
    const fallback = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    const value = month ?? fallback

    if (!/^\d{4}-\d{2}$/.test(value)) {
      throw new BadRequestException('month deve estar no formato YYYY-MM')
    }

    const [year, monthNumber] = value.split('-').map(Number)

    if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
      throw new BadRequestException('month inválido')
    }

    return value
  }

  private async syncCustomerLastVisitAt(customerId: string) {
    const latestCompletedAppointment = await this.appointmentsRepository.findLatestCompletedForCustomer(customerId)

    await this.businessesRepository.updateCustomerLastVisitAt(
      customerId,
      latestCompletedAppointment?.scheduledAt ?? null
    )
  }

  private buildPublicAppointmentResponse(appointment: {
    publicToken: string
    scheduledAt: Date
    price: unknown
    status: AppointmentStatus
    serviceName: string
    customerName: string
  }) {
    const canCancel =
      appointment.status === AppointmentStatus.SCHEDULED &&
      appointment.scheduledAt.getTime() > Date.now()

    return {
      token: appointment.publicToken,
      service: appointment.serviceName,
      customerName: appointment.customerName,
      scheduledAt: appointment.scheduledAt.toISOString(),
      price: Number(appointment.price ?? 0).toFixed(2),
      status: appointment.status,
      canCancel,
    }
  }

  private normalizePhone(phone: string) {
    return phone.replace(/\D/g, '')
  }

  async getAll(
    businessId: string,
    statusFilter: 'active' | 'completed' | 'all' = 'all',
    pagination: PaginationParams | null = null
  ) {
    const business = await this.businessesRepository.findBusinessById(businessId)
    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    return this.appointmentsRepository.findMany(business.id, statusFilter, pagination)
  }

  async create(data: CreateAppointmentDto) {
    const business = await this.businessesRepository.findBusinessById(data.businessId)
    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    const service = await this.businessesRepository.findServiceById(data.serviceId)
    if (!service || service.businessId !== business.id) {
      throw new BadRequestException('Serviço inválido para o negócio informado')
    }

    const scheduledAt = this.timezoneService.validateAppointmentDateTime(data.date, data.time, business.timezone)
    const endsAt = new Date(scheduledAt.getTime() + service.durationMinutes * 60_000)
    const conflicts = await this.appointmentsRepository.findConflicts(business.id, scheduledAt, endsAt)

    if (conflicts) {
      throw new BadRequestException('Já existe um agendamento nesse horário para este negócio')
    }

    const phone = data.phone.trim()
    const customerName = data.customerName.trim()
    const existingCustomer = await this.businessesRepository.findCustomerByPhone(business.id, phone)
    const customer =
      existingCustomer && existingCustomer.name !== customerName
        ? await this.businessesRepository.updateCustomerName(existingCustomer.id, customerName)
        : existingCustomer ?? (await this.businessesRepository.createCustomer(business.id, customerName, phone))

    const appointment = await this.appointmentsRepository.create({
      businessId: business.id,
      serviceId: data.serviceId,
      customerId: customer.id,
      scheduledAt,
      endsAt,
      price: service.price,
    })
    const publicToken = await this.appointmentsRepository.ensurePublicToken(appointment.id)

    this.businessesService.invalidateBusinessAvailability(business.id)

    return {
      ...appointment,
      publicToken,
      publicUrl: publicToken ? `/appointments/${publicToken}` : null,
    }
  }

  async getPublicByToken(token: string) {
    const appointment = await this.appointmentsRepository.findPublicByToken(token)

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    return this.buildPublicAppointmentResponse(appointment)
  }

  async getPublicByCustomerPhone(phone: string, businessId?: string) {
    const normalizedPhone = this.normalizePhone(phone)

    if (normalizedPhone.length < 8) {
      throw new BadRequestException('Informe um telefone válido')
    }

    let resolvedBusinessId: string | undefined

    if (businessId) {
      const business = await this.businessesRepository.findBusinessById(businessId)

      if (!business) {
        throw new BadRequestException('Negócio inválido')
      }

      resolvedBusinessId = business.id
    }

    const appointments = await this.appointmentsRepository.findPublicByCustomerPhone(
      normalizedPhone,
      resolvedBusinessId
    )

    return appointments.map((appointment: {
      id: string
      publicToken: string
      serviceName: string
      scheduledAt: Date
      status: AppointmentStatus
      price: unknown
    }) => ({
      id: appointment.id,
      publicToken: appointment.publicToken,
      serviceName: appointment.serviceName,
      scheduledAt: appointment.scheduledAt.toISOString(),
      status: appointment.status,
      price: Number(appointment.price ?? 0).toFixed(2),
    }))
  }

  async cancelPublicByToken(token: string) {
    const appointment = await this.appointmentsRepository.findPublicByToken(token)

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Este agendamento não pode mais ser cancelado')
    }

    if (appointment.scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('Este agendamento não pode mais ser cancelado')
    }

    const result = await this.appointmentsRepository.cancelByPublicToken(token)

    if (!result) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    this.businessesService.invalidateBusinessAvailability(appointment.businessId)

    return {
      ...this.buildPublicAppointmentResponse({
        ...appointment,
        status: AppointmentStatus.CANCELED,
      }),
      canceled: true,
    }
  }

  async getMonthlyRevenue(businessId: string, month?: string) {
    const business = await this.businessesRepository.findBusinessById(businessId)
    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    const normalizedMonth = this.normalizeMonth(month)
    const [year, monthNumber] = normalizedMonth.split('-').map(Number)
    const rangeStart = new Date(Date.UTC(year, monthNumber - 1, 1))
    const rangeEnd = new Date(Date.UTC(year, monthNumber, 1))
    const summary = await this.appointmentsRepository.aggregateMonthlyRevenue({
      businessId: business.id,
      rangeStart,
      rangeEnd,
    })
    const totalRevenue = Number(summary._sum.price ?? 0)
    const completedAppointments = summary._count._all
    const averageTicket = completedAppointments > 0 ? totalRevenue / completedAppointments : 0

    return {
      month: normalizedMonth,
      totalRevenue,
      completedAppointments,
      averageTicket,
    }
  }

  async delete(id: string, businessId: string) {
    const business = await this.businessesRepository.findBusinessById(businessId)
    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    const appointment = await this.appointmentsRepository.findById(id, business.id)
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    const result = await this.appointmentsRepository.delete(id, business.id)
    if (result.count === 0) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      await this.syncCustomerLastVisitAt(appointment.customerId)
    }

    this.businessesService.invalidateBusinessAvailability(business.id)

    return { id }
  }

  async updateStatus(id: string, businessId: string, statusDto: UpdateAppointmentStatusDto) {
    const business = await this.businessesRepository.findBusinessById(businessId)
    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    const appointment = await this.appointmentsRepository.findById(id, business.id)
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    const result = await this.appointmentsRepository.updateStatus(id, business.id, statusDto.status)
    if (!result) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    await this.syncCustomerLastVisitAt(appointment.customerId)
    this.businessesService.invalidateBusinessAvailability(business.id)

    return { id, status: statusDto.status }
  }
}
