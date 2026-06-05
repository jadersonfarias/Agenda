import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { DateTime } from 'luxon'
import { BusinessesRepository } from './businesses.repository'
import { AvailabilityCacheService } from '../scheduling/availability-cache.service'
import { TimezoneService } from '../scheduling/timezone.service'
import { PrismaService } from '../prisma/prisma.service'
import { PaginationParams } from '../common/pagination'

type BusinessAvailabilityContext = {
  id: string
  openTime: string
  closeTime: string
  timezone: string
}

type ServiceAvailabilityContext = {
  id: string
  businessId: string
  durationMinutes: number
}

type TimeRange = {
  startsAt: Date
  endsAt: Date
}

type AvailabilitySlotStatus = 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE'

type AvailabilitySlot = {
  time: string
  status: AvailabilitySlotStatus
}

@Injectable()
export class BusinessesService {
  private static readonly ACTIVE_CUSTOMER_WINDOW_DAYS = 30

  constructor(
    private readonly businessesRepository: BusinessesRepository,
    private readonly timezoneService: TimezoneService,
    private readonly availabilityCacheService: AvailabilityCacheService,
    private readonly prisma: PrismaService
  ) {}

  async getServices(businessId: string, pagination: PaginationParams | null = null) {
    const business = await this.businessesRepository.findBusinessById(businessId)
    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    return this.businessesRepository.findServices(business.id, pagination)
  }

  async getPublicBusiness(businessId: string) {
    const business = await this.businessesRepository.findBusinessById(businessId)

    if (!business) {
      throw new NotFoundException('Negócio não encontrado')
    }

    return this.mapPublicBusiness(business)
  }

  async getPublicBusinessBySlug(slug: string) {
    const business = await this.businessesRepository.findBusinessById(slug)

    if (!business || business.slug !== slug) {
      throw new NotFoundException('Negócio não encontrado')
    }

    return this.mapPublicBusiness(business)
  }

  async getAvailability(businessId: string, serviceId: string, date: string) {
    const business = await this.getBusinessContextOrThrow(businessId)
    const service = await this.getServiceContextOrThrow(serviceId, business.id)
    const cacheKey = this.buildAvailabilityCacheKey(business.id, service.id, date)
    const cachedAvailability = this.availabilityCacheService.get<AvailabilitySlot[]>(cacheKey)

    if (cachedAvailability) {
      return cachedAvailability
    }

    const availability = await this.calculateAvailability({
      business,
      service,
      date,
    })

    this.availabilityCacheService.set(cacheKey, availability)
    return availability
  }

  async getActiveCustomers(businessId: string) {
    const business = await this.businessesRepository.findBusinessById(businessId)
    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    const activeSince = new Date()
    activeSince.setDate(activeSince.getDate() - BusinessesService.ACTIVE_CUSTOMER_WINDOW_DAYS)

    return this.businessesRepository.findActiveCustomersByBusinessId(business.id, activeSince)
  }

  invalidateBusinessAvailability(businessId: string) {
    this.availabilityCacheService.deleteByPrefix(`availability:${businessId}:`)
  }

  private mapPublicBusiness(business: {
    id: string
    name: string
    slug: string
    openTime: string
    closeTime: string
  }) {
    return {
      id: business.id,
      name: business.name,
      slug: business.slug,
      openTime: business.openTime,
      closeTime: business.closeTime,
    }
  }

  private async getBusinessContextOrThrow(businessId: string): Promise<BusinessAvailabilityContext> {
    const business = await this.businessesRepository.findBusinessById(businessId)

    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    return {
      id: business.id,
      openTime: business.openTime,
      closeTime: business.closeTime,
      timezone: business.timezone,
    }
  }

  private async getServiceContextOrThrow(serviceId: string, businessId: string): Promise<ServiceAvailabilityContext> {
    const service = await this.businessesRepository.findServiceById(serviceId)

    if (!service || service.businessId !== businessId) {
      throw new BadRequestException('Serviço inválido para o negócio informado')
    }

    return {
      id: service.id,
      businessId: service.businessId,
      durationMinutes: service.durationMinutes,
    }
  }

  private async findManualBlocksInRange(businessId: string, openDateUtc: Date, closeDateUtc: Date) {
    try {
      return await this.prisma.manualBlock.findMany({
        where: {
          businessId,
          startsAt: { lt: closeDateUtc },
          endsAt: { gt: openDateUtc },
        },
        select: {
          startsAt: true,
          endsAt: true,
        },
        orderBy: { startsAt: 'asc' },
      })
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2021'
      ) {
        return []
      }

      throw error
    }
  }

  private async calculateAvailability(input: {
    business: BusinessAvailabilityContext
    service: ServiceAvailabilityContext
    date: string
  }) {
    const { business, service, date } = input
    const { openDateUtc, closeDateUtc } = this.timezoneService.getBusinessHoursWindow(
      date,
      business.timezone,
      business.openTime,
      business.closeTime
    )
    const appointments = await this.businessesRepository.findAppointmentsInRange({
      businessId: business.id,
      rangeStart: openDateUtc,
      rangeEnd: closeDateUtc,
    })
    const manualBlocks = await this.findManualBlocksInRange(business.id, openDateUtc, closeDateUtc)
    const appointmentRanges: TimeRange[] = appointments.map((appointment: { scheduledAt: Date; endsAt: Date }) => ({
      startsAt: new Date(appointment.scheduledAt),
      endsAt: new Date(appointment.endsAt),
    }))
    const manualBlockRanges: TimeRange[] = manualBlocks.map((manualBlock: { startsAt: Date; endsAt: Date }) => ({
      startsAt: new Date(manualBlock.startsAt),
      endsAt: new Date(manualBlock.endsAt),
    }))
    const slots: AvailabilitySlot[] = []
    const durationMs = service.durationMinutes * 60_000
    const slotStepMs = durationMs
    const nowInBusinessTimezone = DateTime.utc().setZone(business.timezone)

    for (let currentTime = openDateUtc.getTime(); currentTime + durationMs <= closeDateUtc.getTime(); currentTime += slotStepMs) {
      const slotStart = new Date(currentTime)
      const slotEnd = new Date(slotStart.getTime() + durationMs)
      const slotStartInBusinessTz = DateTime.fromJSDate(slotStart, { zone: 'utc' }).setZone(business.timezone)
      const time = this.timezoneService.formatUtcTimeInTimezone(slotStart, business.timezone)

      if (slotStartInBusinessTz < nowInBusinessTimezone) {
        slots.push({ time, status: 'UNAVAILABLE' })
        continue
      }

      const hasBookedConflict = this.hasRangeConflict(slotStart, slotEnd, appointmentRanges)
      const hasUnavailableConflict = this.hasRangeConflict(slotStart, slotEnd, manualBlockRanges)

      slots.push({
        time,
        status: hasBookedConflict ? 'BOOKED' : hasUnavailableConflict ? 'UNAVAILABLE' : 'AVAILABLE',
      })
    }

    return slots
  }

  private hasRangeConflict(slotStart: Date, slotEnd: Date, ranges: TimeRange[]) {
    return ranges.some((range) => (
      slotStart.getTime() < range.endsAt.getTime() &&
      slotEnd.getTime() > range.startsAt.getTime()
    ))
  }

  private buildAvailabilityCacheKey(businessId: string, serviceId: string, date: string) {
    return `availability:${businessId}:${serviceId}:${date}`
  }
}
