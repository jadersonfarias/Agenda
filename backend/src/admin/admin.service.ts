import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { AdminRepository } from './admin.repository'
import { PaginationParams } from '../common/pagination'
import { BusinessesService } from '../businesses/businesses.service'
import {
  AcceptInvitationDto,
  AdminBusinessAvailabilityDto,
  AdminCreateInvitationDto,
  AdminCreateMembershipDto,
  AdminMembershipRoleDto,
  AdminServiceDto,
} from './admin.schema'
import { UpdateAppointmentStatusDto } from '../appointments/appointment.schema'

type AdminServiceRecord = Awaited<ReturnType<AdminRepository['listServicesByBusinessId']>>[number]
type AdminBusinessRecord = NonNullable<Awaited<ReturnType<AdminRepository['findBusinessById']>>>
type AdminSingleServiceRecord = NonNullable<Awaited<ReturnType<AdminRepository['findServiceById']>>>
type AdminMembershipRecord = Awaited<ReturnType<AdminRepository['listMembershipsByBusinessId']>>[number]
type AdminInvitationRecord = Awaited<ReturnType<AdminRepository['listInvitationsByBusinessId']>>[number]
type AdminInvitationByTokenRecord = NonNullable<Awaited<ReturnType<AdminRepository['findInvitationByToken']>>>
type AdminAppointmentRecord = {
  id: string
  scheduledAt: Date
  completedAt: Date | null
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELED'
  price: { toString(): string }
  service: {
    id: string
    name: string
  }
  customer: {
    id: string
    name: string
    phone: string
  }
}

@Injectable()
export class AdminService {
  private static readonly ACTIVE_CUSTOMER_WINDOW_DAYS = 30
  private static readonly INVITATION_EXPIRATION_DAYS = 7

  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly businessesService: BusinessesService,
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

  private async getBusinessOrThrow(businessId: string) {
    const business = await this.adminRepository.findBusinessById(businessId)

    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    return business
  }

  private async syncCustomerLastVisitAt(customerId: string) {
    const latestCompletedAppointment = await this.adminRepository.findLatestCompletedForCustomer(customerId)

    await this.adminRepository.updateCustomerLastVisitAt(
      customerId,
      latestCompletedAppointment?.scheduledAt ?? null
    )
  }

  private mapBusiness(business: AdminBusinessRecord) {
    return {
      id: business.id,
      name: business.name,
      slug: business.slug,
      openTime: business.openTime,
      closeTime: business.closeTime,
    }
  }

  private mapService(service: AdminServiceRecord | AdminSingleServiceRecord) {
    return {
      id: service.id,
      name: service.name,
      price: service.price.toString(),
      durationMinutes: service.durationMinutes,
      appointmentCount: service._count.appointments,
      createdAt: service.createdAt.toISOString(),
    }
  }

  private mapMembership(membership: AdminMembershipRecord) {
    return {
      id: membership.id,
      role: membership.role,
      createdAt: membership.createdAt.toISOString(),
      updatedAt: membership.updatedAt.toISOString(),
      user: {
        id: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
      },
    }
  }

  private mapInvitation(invitation: AdminInvitationRecord) {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      expiresAt: invitation.expiresAt.toISOString(),
      acceptedAt: invitation.acceptedAt ? invitation.acceptedAt.toISOString() : null,
      createdAt: invitation.createdAt.toISOString(),
      isExpired: invitation.expiresAt.getTime() <= Date.now(),
    }
  }

  private mapInvitationDetails(invitation: AdminInvitationByTokenRecord, userExists: boolean) {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      expiresAt: invitation.expiresAt.toISOString(),
      acceptedAt: invitation.acceptedAt ? invitation.acceptedAt.toISOString() : null,
      createdAt: invitation.createdAt.toISOString(),
      isExpired: invitation.expiresAt.getTime() <= Date.now(),
      userExists,
      business: invitation.business,
    }
  }

  private mapAppointment(appointment: AdminAppointmentRecord) {
    return {
      id: appointment.id,
      scheduledAt: appointment.scheduledAt.toISOString(),
      completedAt: appointment.completedAt ? appointment.completedAt.toISOString() : null,
      status: appointment.status,
      price: appointment.price.toString(),
      service: appointment.service,
      customer: appointment.customer,
    }
  }

  async getDefaultBusinessIdForUser(userId: string) {
    const businessId = await this.adminRepository.findFirstBusinessByUserId(userId)

    if (!businessId) {
      throw new NotFoundException('Nenhum negócio vinculado a este usuário')
    }

    return businessId
  }

  async getDashboard(businessId: string) {
    const business = await this.getBusinessOrThrow(businessId)
    const services = await this.adminRepository.listServicesByBusinessId(business.id)

    return {
      business: this.mapBusiness(business),
      services: services.map((service: AdminServiceRecord) => this.mapService(service)),
    }
  }

  async listServices(businessId: string, pagination: PaginationParams | null = null) {
    const business = await this.getBusinessOrThrow(businessId)
    const services = await this.adminRepository.listServicesByBusinessId(business.id, pagination)

    return pagination
      ? {
          data: services.data.map((service: AdminServiceRecord) => this.mapService(service)),
          meta: services.meta,
        }
      : services.map((service: AdminServiceRecord) => this.mapService(service))
  }

  async listMemberships(businessId: string) {
    const business = await this.getBusinessOrThrow(businessId)
    const memberships = await this.adminRepository.listMembershipsByBusinessId(business.id)

    return memberships.map((membership: AdminMembershipRecord) => this.mapMembership(membership))
  }

  async listInvitations(businessId: string) {
    const business = await this.getBusinessOrThrow(businessId)
    const invitations = await this.adminRepository.listInvitationsByBusinessId(business.id)

    return invitations.map((invitation: AdminInvitationRecord) => this.mapInvitation(invitation))
  }

  async createMembership(input: AdminCreateMembershipDto) {
    const business = await this.getBusinessOrThrow(input.businessId)
    const user = await this.adminRepository.findUserByEmail(input.email)

    if (!user) {
      throw new NotFoundException('Usuário não encontrado para este email')
    }

    const existingMembership = await this.adminRepository.findMembershipByUserAndBusinessId(user.id, business.id)

    if (existingMembership) {
      throw new BadRequestException('Este usuário já faz parte deste negócio')
    }

    const membership = await this.adminRepository.createMembership({
      businessId: business.id,
      userId: user.id,
      role: input.role,
    })

    return this.mapMembership(membership)
  }

  async createInvitation(input: AdminCreateInvitationDto) {
    const business = await this.getBusinessOrThrow(input.businessId)
    const existingUser = await this.adminRepository.findUserByEmail(input.email)

    if (existingUser) {
      const existingMembership = await this.adminRepository.findMembershipByUserAndBusinessId(existingUser.id, business.id)

      if (existingMembership) {
        throw new BadRequestException('Este usuário já faz parte deste negócio')
      }
    }

    const pendingInvitation = await this.adminRepository.findPendingInvitationByBusinessAndEmail(business.id, input.email)

    if (pendingInvitation && pendingInvitation.expiresAt.getTime() > Date.now()) {
      throw new BadRequestException('Já existe um convite pendente para este email')
    }

    const token = randomBytes(24).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + AdminService.INVITATION_EXPIRATION_DAYS)

    const invitation = await this.adminRepository.createInvitation({
      businessId: business.id,
      email: input.email,
      role: input.role,
      token,
      expiresAt,
    })

    return this.mapInvitation(invitation)
  }

  async getInvitationDetails(token: string) {
    const invitation = await this.adminRepository.findInvitationByToken(token)

    if (!invitation) {
      throw new NotFoundException('Convite não encontrado')
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Este convite já foi aceito')
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Este convite expirou')
    }

    const existingUser = await this.adminRepository.findUserByEmail(invitation.email)

    if (existingUser) {
      const existingMembership = await this.adminRepository.findMembershipByUserAndBusinessId(existingUser.id, invitation.businessId)

      if (existingMembership) {
        throw new BadRequestException('Este usuário já faz parte deste negócio')
      }
    }

    return this.mapInvitationDetails(invitation, Boolean(existingUser))
  }

  async acceptInvitation(token: string, input: AcceptInvitationDto) {
    const invitation = await this.adminRepository.findInvitationByToken(token)

    if (!invitation) {
      throw new NotFoundException('Convite não encontrado')
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Este convite já foi aceito')
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Este convite expirou')
    }

    const existingUser = await this.adminRepository.findUserByEmail(invitation.email)

    if (existingUser) {
      const existingMembership = await this.adminRepository.findMembershipByUserAndBusinessId(existingUser.id, invitation.businessId)

      if (existingMembership) {
        throw new BadRequestException('Este usuário já faz parte deste negócio')
      }
    } else {
      if (!input.name) {
        throw new BadRequestException('Informe o nome para criar a conta do convidado')
      }

      if (!input.password) {
        throw new BadRequestException('Informe uma senha para criar a conta do convidado')
      }
    }

    const result = await this.adminRepository.acceptInvitation({
      invitationId: invitation.id,
      businessId: invitation.businessId,
      email: invitation.email,
      role: invitation.role,
      name: input.name,
      password: input.password,
    })

    return {
      success: true,
      userCreated: !existingUser,
      business: invitation.business,
      invitation: this.mapInvitation(result.invitation),
      membership: this.mapMembership(result.membership),
    }
  }

  async updateMembershipRole(membershipId: string, input: AdminMembershipRoleDto) {
    const business = await this.getBusinessOrThrow(input.businessId)
    const membership = await this.adminRepository.findMembershipById(membershipId)

    if (!membership || membership.businessId !== business.id) {
      throw new NotFoundException('Membership não encontrada para este negócio')
    }

    if (membership.role === input.role) {
      return this.mapMembership(membership)
    }

    if (membership.role === 'OWNER' && input.role !== 'OWNER') {
      const ownersCount = await this.adminRepository.countOwnersByBusinessId(business.id)

      if (ownersCount <= 1) {
        throw new BadRequestException('Não é permitido remover o último OWNER')
      }
    }

    const updatedMembership = await this.adminRepository.updateMembershipRole(membershipId, input.role)

    return this.mapMembership(updatedMembership)
  }

  async deleteMembership(membershipId: string, businessId: string) {
    const business = await this.getBusinessOrThrow(businessId)
    const membership = await this.adminRepository.findMembershipById(membershipId)

    if (!membership || membership.businessId !== business.id) {
      throw new NotFoundException('Membership não encontrada para este negócio')
    }

    if (membership.role === 'OWNER') {
      const ownersCount = await this.adminRepository.countOwnersByBusinessId(business.id)

      if (ownersCount <= 1) {
        throw new BadRequestException('Não é permitido remover o último OWNER')
      }
    }

    await this.adminRepository.deleteMembership(membershipId)

    return { success: true }
  }

  async listAppointments(
    businessId: string,
    statusFilter: 'active' | 'completed' | 'all' = 'all',
    pagination: PaginationParams | null = null
  ) {
    const business = await this.getBusinessOrThrow(businessId)
    const appointments = await this.adminRepository.listAppointmentsByBusinessId(business.id, statusFilter, pagination)

    return pagination
      ? {
        data: appointments.data.map((appointment: AdminAppointmentRecord) => this.mapAppointment(appointment)),
        meta: appointments.meta,
      }
      : appointments.map((appointment: AdminAppointmentRecord) => this.mapAppointment(appointment))
  }

  async createService(input: AdminServiceDto) {
    const business = await this.getBusinessOrThrow(input.businessId)
    const service = await this.adminRepository.createService({
      businessId: business.id,
      name: input.name,
      price: input.price,
      durationMinutes: input.durationMinutes,
    })

    return this.mapService(service)
  }

  async updateService(serviceId: string, input: AdminServiceDto) {
    const business = await this.getBusinessOrThrow(input.businessId)
    const currentService = await this.adminRepository.findServiceById(serviceId)

    if (!currentService || currentService.businessId !== business.id) {
      throw new NotFoundException('Serviço não encontrado para este negócio')
    }

    const service = await this.adminRepository.updateService({
      serviceId,
      name: input.name,
      price: input.price,
      durationMinutes: input.durationMinutes,
    })

    return this.mapService(service)
  }

  async deleteService(serviceId: string, businessId: string) {
    const business = await this.getBusinessOrThrow(businessId)
    const currentService = await this.adminRepository.findServiceById(serviceId)

    if (!currentService || currentService.businessId !== business.id) {
      throw new NotFoundException('Serviço não encontrado para este negócio')
    }

    if (currentService._count.appointments > 0) {
      throw new BadRequestException('Este serviço possui agendamentos e não pode ser removido')
    }

    await this.adminRepository.deleteService(serviceId)

    return { success: true }
  }

  async updateBusinessAvailability(input: AdminBusinessAvailabilityDto) {
    const business = await this.getBusinessOrThrow(input.businessId)
    const updatedBusiness = await this.adminRepository.updateBusinessAvailability({
      businessId: business.id,
      openTime: input.openTime,
      closeTime: input.closeTime,
    })

    this.businessesService.invalidateBusinessAvailability(business.id)

    return updatedBusiness
  }

  async updateAppointmentStatus(
    appointmentId: string,
    businessId: string,
    statusDto: UpdateAppointmentStatusDto
  ) {
    const business = await this.getBusinessOrThrow(businessId)
    const appointment = await this.adminRepository.findAppointmentById(appointmentId, business.id)

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado')
    }

    const result = await this.adminRepository.updateAppointmentStatus(appointmentId, statusDto.status)

    await this.syncCustomerLastVisitAt(appointment.customerId)
    this.businessesService.invalidateBusinessAvailability(business.id)

    return result
  }

  async getMonthlySummary(businessId: string, month?: string) {
    const business = await this.getBusinessOrThrow(businessId)
    const normalizedMonth = this.normalizeMonth(month)
    const [year, monthNumber] = normalizedMonth.split('-').map(Number)
    const rangeStart = new Date(Date.UTC(year, monthNumber - 1, 1))
    const rangeEnd = new Date(Date.UTC(year, monthNumber, 1))
    const activeSince = new Date()
    activeSince.setDate(activeSince.getDate() - AdminService.ACTIVE_CUSTOMER_WINDOW_DAYS)

    const [monthlyRevenue, customerCounts] = await Promise.all([
      this.adminRepository.aggregateMonthlyRevenue({
        businessId: business.id,
        rangeStart,
        rangeEnd,
      }),
      this.adminRepository.countCustomersByBusinessId(business.id, activeSince),
    ])

    const totalRevenue = Number(monthlyRevenue._sum.price ?? 0)
    const completedAppointments = monthlyRevenue._count._all
    const averageTicket = completedAppointments > 0 ? totalRevenue / completedAppointments : 0

    return {
      month: normalizedMonth,
      totalRevenue: totalRevenue.toFixed(2),
      completedAppointments,
      averageTicket: averageTicket.toFixed(2),
      activeCustomers: customerCounts.activeCustomers,
      inactiveCustomers: customerCounts.inactiveCustomers,
      activeCustomerWindowDays: AdminService.ACTIVE_CUSTOMER_WINDOW_DAYS,
    }
  }
}
