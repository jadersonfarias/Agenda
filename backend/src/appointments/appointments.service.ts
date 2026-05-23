import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { AppointmentStatus } from '@prisma/client'
import { AppointmentsRepository } from './appointments.repository'
import { AppointmentStatusFilter } from './appointment-status-filter'
import { BusinessesRepository } from '../businesses/businesses.repository'
import { BusinessesService } from '../businesses/businesses.service'
import { TimezoneService } from '../scheduling/timezone.service'
import { PaginationParams, PaginatedResult } from '../common/pagination'
import {
  CustomerAppointmentsLookupDto,
  CreateAppointmentDto,
  PublicAppointmentTokenDto,
  UpdateAppointmentAssigneeDto,
  UpdateAppointmentStatusDto,
} from './appointment.schema'
import { SubscriptionService } from '../subscriptions/subscription.service'
import { MembershipRole } from '../auth/role.types'

type AdminAppointmentAccess = {
  userId: string
  role: MembershipRole
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly businessesRepository: BusinessesRepository,
    private readonly businessesService: BusinessesService,
    private readonly timezoneService: TimezoneService,
    private readonly subscriptionService: SubscriptionService
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

  private buildPhoneVariants(phone: string) {
    const normalized = phone.replace(/\D/g, '')
    const variants = new Set<string>()

    if (normalized.length > 0) {
      variants.add(normalized)
    }

    if (normalized.length >= 11) {
      variants.add(normalized.slice(-11))
    }

    if (normalized.length >= 10) {
      variants.add(normalized.slice(-10))
    }

    return [...variants]
  }

  private toPublicAppointmentResponse(appointment: {
    publicToken: string
    scheduledAt: Date
    status: AppointmentStatus
    price: { toString(): string } | string | number
    service: {
      name: string
    }
    customer: {
      name: string
    }
  }) {
    const canCancel =
      appointment.status === AppointmentStatus.SCHEDULED &&
      appointment.scheduledAt.getTime() > Date.now()

    return {
      token: appointment.publicToken,
      service: appointment.service.name,
      customerName: appointment.customer.name,
      scheduledAt: appointment.scheduledAt.toISOString(),
      price: appointment.price.toString(),
      status: appointment.status,
      canCancel,
    }
  }

  async getAll(
    businessId: string,
    statusFilter: AppointmentStatusFilter = 'all',
    pagination: PaginationParams | null = null
  ) {
    const business = await this.businessesRepository.findBusinessById(businessId)
    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    return this.appointmentsRepository.findMany({
      businessId: business.id,
      statusFilter,
      pagination,
    })
  }

  async getAllForAdmin(
    businessId: string,
    statusFilter: AppointmentStatusFilter = 'all',
    pagination: PaginationParams | null = null,
    access: AdminAppointmentAccess,
    assignedToUserId?: string
  ) {
    const business = await this.businessesRepository.findBusinessById(businessId)
    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    return this.appointmentsRepository.findMany({
      businessId: business.id,
      statusFilter,
      pagination,
      assignedToUserId: access.role === 'STAFF' ? access.userId : assignedToUserId,
    })
  }

  async getByCustomerPhone(query: CustomerAppointmentsLookupDto) {
    const phoneVariants = this.buildPhoneVariants(query.phone.trim())
    const appointments = await this.appointmentsRepository.findPublicByCustomerPhoneVariants(phoneVariants)

    return appointments.map((appointment: {
      id: string
      publicToken: string
      scheduledAt: Date
      status: AppointmentStatus
      price: { toString(): string } | string | number
      service: {
        name: string
      }
    }) => ({
      id: appointment.id,
      publicToken: appointment.publicToken,
      serviceName: appointment.service.name,
      scheduledAt: appointment.scheduledAt.toISOString(),
      status: appointment.status,
      price: appointment.price.toString(),
    }))
  }

  async getPublicByToken(params: PublicAppointmentTokenDto) {
    const appointment = await this.appointmentsRepository.findByPublicToken(params.token)

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    return this.toPublicAppointmentResponse(appointment)
  }

  async create(data: CreateAppointmentDto) {
    const business = await this.businessesRepository.findBusinessById(data.businessId)
    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    await this.subscriptionService.assertBusinessCanWrite(business.id)

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

    this.businessesService.invalidateBusinessAvailability(business.id)

    return appointment
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

    await this.subscriptionService.assertBusinessCanWrite(business.id)

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

  async updateStatusForAdmin(
    id: string,
    businessId: string,
    statusDto: UpdateAppointmentStatusDto,
    access: AdminAppointmentAccess
  ) {
    const business = await this.businessesRepository.findBusinessById(businessId)
    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    await this.subscriptionService.assertBusinessCanWrite(business.id)

    const appointment = await this.appointmentsRepository.findById(id, business.id)
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    if (access.role === 'STAFF' && appointment.assignedToUserId !== access.userId) {
      throw new ForbiddenException('Usuário sem permissão para este agendamento')
    }

    const result = await this.appointmentsRepository.updateStatus(id, business.id, statusDto.status)
    if (!result) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    await this.syncCustomerLastVisitAt(appointment.customerId)
    this.businessesService.invalidateBusinessAvailability(business.id)

    return { id, status: statusDto.status }
  }

  async updateAssignee(id: string, businessId: string, assigneeDto: UpdateAppointmentAssigneeDto) {
    const business = await this.businessesRepository.findBusinessById(businessId)
    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    await this.subscriptionService.assertBusinessCanWrite(business.id)

    const appointment = await this.appointmentsRepository.findById(id, business.id)
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    const updatedAppointment = await this.appointmentsRepository.updateAssignee(
      id,
      business.id,
      assigneeDto.assignedToUserId
    )

    if (!updatedAppointment) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    return updatedAppointment
  }

  async cancelPublicAppointment(params: PublicAppointmentTokenDto) {
    const appointment = await this.appointmentsRepository.findByPublicToken(params.token)

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    await this.subscriptionService.assertBusinessCanWrite(appointment.businessId)

    const canCancel =
      appointment.status === AppointmentStatus.SCHEDULED &&
      appointment.scheduledAt.getTime() > Date.now()

    if (!canCancel) {
      throw new BadRequestException('Este agendamento não pode mais ser cancelado')
    }

    await this.appointmentsRepository.updateStatus(
      appointment.id,
      appointment.businessId,
      AppointmentStatus.CANCELED
    )
    this.businessesService.invalidateBusinessAvailability(appointment.businessId)

    const updatedAppointment = await this.appointmentsRepository.findByPublicToken(params.token)

    if (!updatedAppointment) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    return {
      ...this.toPublicAppointmentResponse(updatedAppointment),
      canceled: true,
    }
  }
}
