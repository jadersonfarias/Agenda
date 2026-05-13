import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { hash } from 'bcryptjs'
import { AdminRepository } from './admin.repository'
import { PaginationParams } from '../common/pagination'
import { BusinessesRepository } from '../businesses/businesses.repository'
import { AppointmentsService } from '../appointments/appointments.service'
import { UpdateAppointmentStatusDto } from '../appointments/appointment.schema'
import {
  AcceptInvitationDto,
  AdminBusinessAvailabilityDto,
  AdminCreateInvitationDto,
  AdminCreateMembershipDto,
  AdminMembershipRoleDto,
  AdminServiceDto,
} from './admin.schema'
import { MembershipRole } from '../auth/role.types'
import { AvailabilityCacheService } from '../scheduling/availability-cache.service'

type AdminServiceRecord = Awaited<ReturnType<AdminRepository['listServicesByBusinessId']>>[number]

type AdminMembershipRecord = {
  id: string
  role: MembershipRole
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    email: string
  }
}

type AdminInvitationRecord = {
  id: string
  email: string
  role: MembershipRole
  token: string
  expiresAt: Date
  acceptedAt: Date | null
  createdAt: Date
}

@Injectable()
export class AdminService {
  private static readonly ACTIVE_CUSTOMER_WINDOW_DAYS = 30
  private static readonly INVITATION_EXPIRATION_DAYS = 7

  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly businessesRepository: BusinessesRepository,
    private readonly appointmentsService: AppointmentsService,
    private readonly availabilityCacheService: AvailabilityCacheService
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

  async getDashboard(businessId: string) {
    const [business, services] = await Promise.all([
      this.businessesRepository.findBusinessById(businessId),
      this.adminRepository.listServicesByBusinessId(businessId),
    ])

    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        openTime: business.openTime,
        closeTime: business.closeTime,
      },
      services: services.map((service: AdminServiceRecord) => ({
        id: service.id,
        name: service.name,
        price: service.price.toString(),
        durationMinutes: service.durationMinutes,
        appointmentCount: service._count.appointments,
        createdAt: service.createdAt.toISOString(),
      })),
    }
  }

  async listServices(businessId: string, pagination: PaginationParams | null = null) {
    const services = await this.adminRepository.listServicesByBusinessId(businessId, pagination)

    return pagination
      ? {
          data: services.data.map((service: AdminServiceRecord) => ({
            id: service.id,
            name: service.name,
            price: service.price.toString(),
            durationMinutes: service.durationMinutes,
            appointmentCount: service._count.appointments,
            createdAt: service.createdAt.toISOString(),
          })),
          meta: services.meta,
        }
      : services.map((service: AdminServiceRecord) => ({
          id: service.id,
          name: service.name,
          price: service.price.toString(),
          durationMinutes: service.durationMinutes,
          appointmentCount: service._count.appointments,
          createdAt: service.createdAt.toISOString(),
        }))
  }

  async createService(businessId: string, dto: AdminServiceDto) {
    const business = await this.businessesRepository.findBusinessById(businessId)

    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    const service = await this.adminRepository.createService({
      businessId,
      name: dto.name,
      price: dto.price,
      durationMinutes: dto.durationMinutes,
    })

    return {
      id: service.id,
      name: service.name,
      price: service.price.toString(),
      durationMinutes: service.durationMinutes,
      appointmentCount: service._count.appointments,
      createdAt: service.createdAt.toISOString(),
    }
  }

  async updateService(id: string, businessId: string, dto: AdminServiceDto) {
    const service = await this.adminRepository.findServiceByIdAndBusinessId(id, businessId)

    if (!service) {
      throw new NotFoundException('Serviço não encontrado')
    }

    const updatedService = await this.adminRepository.updateService(id, businessId, {
      name: dto.name,
      price: dto.price,
      durationMinutes: dto.durationMinutes,
    })

    if (!updatedService) {
      throw new NotFoundException('Serviço não encontrado')
    }

    return {
      id: updatedService.id,
      name: updatedService.name,
      price: updatedService.price.toString(),
      durationMinutes: updatedService.durationMinutes,
      appointmentCount: updatedService._count.appointments,
      createdAt: updatedService.createdAt.toISOString(),
    }
  }

  async deleteService(id: string, businessId: string) {
    const service = await this.adminRepository.findServiceByIdAndBusinessId(id, businessId)

    if (!service) {
      throw new NotFoundException('Serviço não encontrado')
    }

    if (service._count.appointments > 0) {
      throw new BadRequestException('Serviços com agendamentos vinculados não podem ser excluídos')
    }

    await this.adminRepository.deleteService(id, businessId)

    return { success: true }
  }

  async updateBusinessAvailability(businessId: string, dto: AdminBusinessAvailabilityDto) {
    const business = await this.adminRepository.updateBusinessAvailability(businessId, {
      openTime: dto.openTime,
      closeTime: dto.closeTime,
    })

    if (!business) {
      throw new NotFoundException('Negócio não encontrado')
    }

    this.availabilityCacheService.deleteByPrefix(`availability:${businessId}:`)

    return business
  }

  async listMemberships(businessId: string) {
    const memberships = await this.adminRepository.listMembershipsByBusinessId(businessId)

    return memberships.map((membership: AdminMembershipRecord) => ({
      id: membership.id,
      role: membership.role,
      createdAt: membership.createdAt.toISOString(),
      updatedAt: membership.updatedAt.toISOString(),
      user: membership.user,
    }))
  }

  async createMembership(businessId: string, dto: AdminCreateMembershipDto) {
    const email = dto.email.toLowerCase()
    const user = await this.adminRepository.findUserByEmail(email)

    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    const existingMembership = await this.adminRepository.findMembershipByUserAndBusinessId(user.id, businessId)

    if (existingMembership) {
      throw new ConflictException('Usuário já é membro deste negócio')
    }

    const membership = await this.adminRepository.createMembership({
      userId: user.id,
      businessId,
      role: dto.role,
    })

    return {
      id: membership.id,
      role: membership.role,
      createdAt: membership.createdAt.toISOString(),
      updatedAt: membership.updatedAt.toISOString(),
      user: membership.user,
    }
  }

  async updateMembershipRole(id: string, businessId: string, dto: AdminMembershipRoleDto) {
    const membership = await this.adminRepository.findMembershipByIdAndBusinessId(id, businessId)

    if (!membership) {
      throw new NotFoundException('Membro não encontrado')
    }

    if (membership.role === 'OWNER' && dto.role !== 'OWNER') {
      await this.ensureBusinessKeepsOwner(businessId, 'Não é possível rebaixar o último OWNER')
    }

    const updatedMembership = await this.adminRepository.updateMembershipRole(id, businessId, dto.role)

    if (!updatedMembership) {
      throw new NotFoundException('Membro não encontrado')
    }

    return {
      id: updatedMembership.id,
      role: updatedMembership.role,
      createdAt: updatedMembership.createdAt.toISOString(),
      updatedAt: updatedMembership.updatedAt.toISOString(),
      user: updatedMembership.user,
    }
  }

  async deleteMembership(id: string, businessId: string) {
    const membership = await this.adminRepository.findMembershipByIdAndBusinessId(id, businessId)

    if (!membership) {
      throw new NotFoundException('Membro não encontrado')
    }

    if (membership.role === 'OWNER') {
      await this.ensureBusinessKeepsOwner(businessId, 'Não é possível remover o último OWNER')
    }

    await this.adminRepository.deleteMembership(id, businessId)

    return { success: true }
  }

  async listInvitations(businessId: string) {
    const invitations = await this.adminRepository.listInvitationsByBusinessId(businessId)

    return invitations.map((invitation: AdminInvitationRecord) => this.mapInvitation(invitation))
  }

  async createInvitation(businessId: string, dto: AdminCreateInvitationDto) {
    const email = dto.email.toLowerCase()
    const existingUser = await this.adminRepository.findUserByEmail(email)

    if (existingUser) {
      const existingMembership = await this.adminRepository.findMembershipByUserAndBusinessId(existingUser.id, businessId)

      if (existingMembership) {
        throw new ConflictException('Usuário já é membro deste negócio')
      }
    }

    const pendingInvitation = await this.adminRepository.findPendingInvitationByBusinessAndEmail(
      businessId,
      email,
      new Date()
    )

    if (pendingInvitation) {
      throw new ConflictException('Já existe um convite pendente para este email')
    }

    const token = await this.generateUniqueInvitationToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + AdminService.INVITATION_EXPIRATION_DAYS)

    const invitation = await this.adminRepository.createInvitation({
      businessId,
      email,
      role: dto.role,
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

    if (this.isExpired(invitation.expiresAt)) {
      throw new BadRequestException('Este convite expirou')
    }

    const existingUser = await this.adminRepository.findUserByEmail(invitation.email)
    const existingMembership = existingUser
      ? await this.adminRepository.findMembershipByUserAndBusinessId(existingUser.id, invitation.businessId)
      : null

    if (existingMembership) {
      throw new ConflictException('Usuário já é membro deste negócio')
    }

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
      acceptedAt: invitation.acceptedAt ? invitation.acceptedAt.toISOString() : null,
      createdAt: invitation.createdAt.toISOString(),
      isExpired: false,
      userExists: Boolean(existingUser),
      business: invitation.business,
    }
  }

  async acceptInvitation(token: string, dto: AcceptInvitationDto) {
    const invitation = await this.adminRepository.findInvitationByToken(token)

    if (!invitation) {
      throw new NotFoundException('Convite não encontrado')
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Este convite já foi aceito')
    }

    if (this.isExpired(invitation.expiresAt)) {
      throw new BadRequestException('Este convite expirou')
    }

    const existingUser = await this.adminRepository.findUserByEmail(invitation.email)

    if (existingUser) {
      const existingMembership = await this.adminRepository.findMembershipByUserAndBusinessId(existingUser.id, invitation.businessId)

      if (existingMembership) {
        throw new ConflictException('Usuário já é membro deste negócio')
      }
    }

    if (!existingUser && !dto.name) {
      throw new BadRequestException('Informe o nome para criar a conta do convidado')
    }

    if (!existingUser && !dto.password) {
      throw new BadRequestException('Informe uma senha para criar a conta do convidado')
    }

    const result = await this.adminRepository.acceptInvitation({
      invitationId: invitation.id,
      businessId: invitation.businessId,
      email: invitation.email,
      role: invitation.role,
      existingUserId: existingUser?.id,
      name: dto.name,
      hashedPassword: dto.password ? await hash(dto.password, 10) : undefined,
    })

    return {
      success: true,
      userCreated: !existingUser,
      business: invitation.business,
      invitation: this.mapInvitation(result.invitation),
      membership: {
        id: result.membership.id,
        role: result.membership.role,
        createdAt: result.membership.createdAt.toISOString(),
        updatedAt: result.membership.updatedAt.toISOString(),
        user: result.membership.user,
      },
    }
  }

  private async ensureBusinessKeepsOwner(businessId: string, message: string) {
    const ownerCount = await this.adminRepository.countOwnersByBusinessId(businessId)

    if (ownerCount <= 1) {
      throw new BadRequestException(message)
    }
  }

  private async generateUniqueInvitationToken() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const token = randomBytes(32).toString('hex')
      const existingInvitation = await this.adminRepository.findInvitationByToken(token)

      if (!existingInvitation) {
        return token
      }
    }

    throw new BadRequestException('Não foi possível gerar um token de convite')
  }

  private mapInvitation(invitation: AdminInvitationRecord) {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      invitationLink: this.buildInvitationLink(invitation.token),
      expiresAt: invitation.expiresAt.toISOString(),
      acceptedAt: invitation.acceptedAt ? invitation.acceptedAt.toISOString() : null,
      createdAt: invitation.createdAt.toISOString(),
      isExpired: this.isExpired(invitation.expiresAt),
    }
  }

  private buildInvitationLink(token: string) {
    const baseUrl = process.env.FRONTEND_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    return `${baseUrl.replace(/\/$/, '')}/invite/${token}`
  }

  private isExpired(expiresAt: Date) {
    return expiresAt.getTime() <= Date.now()
  }

  async listAppointments(
    businessId: string,
    statusFilter: 'active' | 'completed' | 'all' = 'all',
    pagination: PaginationParams | null = null
  ) {
    return this.appointmentsService.getAll(businessId, statusFilter, pagination)
  }

  async updateAppointmentStatus(id: string, businessId: string, statusDto: UpdateAppointmentStatusDto) {
    return this.appointmentsService.updateStatus(id, businessId, statusDto)
  }

  async getMonthlySummary(businessId: string, month?: string) {
    const normalizedMonth = this.normalizeMonth(month)
    const monthlyRevenue = await this.appointmentsService.getMonthlyRevenue(businessId, normalizedMonth)
    const activeSince = new Date()
    activeSince.setDate(activeSince.getDate() - AdminService.ACTIVE_CUSTOMER_WINDOW_DAYS)

    const [totalCustomers, activeCustomers] = await Promise.all([
      this.adminRepository.countCustomersByBusinessId(businessId),
      this.adminRepository.countActiveCustomersByBusinessId(businessId, activeSince),
    ])

    return {
      month: monthlyRevenue.month,
      totalRevenue: monthlyRevenue.totalRevenue,
      completedAppointments: monthlyRevenue.completedAppointments,
      averageTicket: monthlyRevenue.averageTicket,
      activeCustomers,
      inactiveCustomers: Math.max(0, totalCustomers - activeCustomers),
      activeCustomerWindowDays: AdminService.ACTIVE_CUSTOMER_WINDOW_DAYS,
    }
  }

  async getFinancialReport(businessId: string, month?: string) {
    const normalizedMonth = this.normalizeMonth(month)
    const monthlyRevenue = await this.appointmentsService.getMonthlyRevenue(businessId, normalizedMonth)
    const [year, monthNumber] = normalizedMonth.split('-').map(Number)
    const rangeStart = new Date(Date.UTC(year, monthNumber - 1, 1))
    const rangeEnd = new Date(Date.UTC(year, monthNumber, 1))
    const [cancellationsCount, completedAppointmentsByService] = await Promise.all([
      this.adminRepository.countCanceledAppointmentsInRange(businessId, rangeStart, rangeEnd),
      this.adminRepository.listCompletedAppointmentsInRangeByService(businessId, rangeStart, rangeEnd),
    ])

    const revenueByServiceMap = new Map<string, {
      serviceId: string
      serviceName: string
      revenueTotal: number
      appointmentsCompleted: number
    }>()

    for (const appointment of completedAppointmentsByService) {
      const existing = revenueByServiceMap.get(appointment.serviceId)
      const price = Number(appointment.price ?? 0)

      if (existing) {
        existing.revenueTotal += price
        existing.appointmentsCompleted += 1
        continue
      }

      revenueByServiceMap.set(appointment.serviceId, {
        serviceId: appointment.serviceId,
        serviceName: appointment.service.name,
        revenueTotal: price,
        appointmentsCompleted: 1,
      })
    }

    const revenueByService = [...revenueByServiceMap.values()].sort((left, right) => {
      if (right.revenueTotal !== left.revenueTotal) {
        return right.revenueTotal - left.revenueTotal
      }

      if (right.appointmentsCompleted !== left.appointmentsCompleted) {
        return right.appointmentsCompleted - left.appointmentsCompleted
      }

      return left.serviceName.localeCompare(right.serviceName)
    })

    return {
      month: monthlyRevenue.month,
      revenueTotal: monthlyRevenue.totalRevenue,
      appointmentsCompleted: monthlyRevenue.completedAppointments,
      averageTicket: monthlyRevenue.averageTicket,
      cancellationsCount,
      revenueByService,
      topServices: revenueByService.slice(0, 3),
    }
  }
}
