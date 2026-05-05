import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { AdminRepository } from './admin.repository'
import { PaginationParams } from '../common/pagination'
import { BusinessesService } from '../businesses/businesses.service'
import { AdminBusinessAvailabilityDto, AdminServiceDto } from './admin.schema'

type AdminServiceRecord = Awaited<ReturnType<AdminRepository['listServicesByBusinessId']>>[number]
type AdminBusinessRecord = NonNullable<Awaited<ReturnType<AdminRepository['findBusinessById']>>>
type AdminSingleServiceRecord = NonNullable<Awaited<ReturnType<AdminRepository['findServiceById']>>>

@Injectable()
export class AdminService {
  private static readonly ACTIVE_CUSTOMER_WINDOW_DAYS = 30

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
