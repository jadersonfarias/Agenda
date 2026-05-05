import { BadRequestException, Injectable } from '@nestjs/common'
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

  async getAvailability(businessId: string, serviceId: string, date: string) {
    const business = await this.getBusinessContextOrThrow(businessId)
    const service = await this.getServiceContextOrThrow(serviceId, business.id)
    const cacheKey = this.buildAvailabilityCacheKey(business.id, service.id, date)
    const cachedAvailability = this.availabilityCacheService.get<string[]>(cacheKey)

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
    const manualBlocks = await this.prisma.manualBlock.findMany({
      where: {
        businessId: business.id,
        startsAt: { lt: closeDateUtc },
        endsAt: { gt: openDateUtc },
      },
      select: {
        startsAt: true,
        endsAt: true,
      },
      orderBy: { startsAt: 'asc' },
    })
    const blockedRanges: TimeRange[] = [
      ...appointments.map((appointment: { scheduledAt: Date; endsAt: Date }) => ({
        startsAt: new Date(appointment.scheduledAt),
        endsAt: new Date(appointment.endsAt),
      })),
      ...manualBlocks.map((manualBlock: { startsAt: Date; endsAt: Date }) => ({
        startsAt: new Date(manualBlock.startsAt),
        endsAt: new Date(manualBlock.endsAt),
      })),
    ].sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())
    const available: string[] = []
    const durationMs = service.durationMinutes * 60_000
    const slotStepMs = durationMs
    const nowInBusinessTimezone = DateTime.utc().setZone(business.timezone)

    let blockedRangeIndex = 0

    for (let currentTime = openDateUtc.getTime(); currentTime + durationMs <= closeDateUtc.getTime(); currentTime += slotStepMs) {
      const slotStart = new Date(currentTime)
      const slotEnd = new Date(slotStart.getTime() + durationMs)
      const slotStartInBusinessTz = DateTime.fromJSDate(slotStart, { zone: 'utc' }).setZone(business.timezone)

      if (slotStartInBusinessTz < nowInBusinessTimezone) {
        continue
      }

      while (
        blockedRangeIndex < blockedRanges.length &&
        blockedRanges[blockedRangeIndex].endsAt.getTime() <= slotStart.getTime()
      ) {
        blockedRangeIndex += 1
      }

      const nextBlockedRange = blockedRanges[blockedRangeIndex]
      const hasConflict =
        Boolean(nextBlockedRange) &&
        slotStart.getTime() < nextBlockedRange.endsAt.getTime() &&
        slotEnd.getTime() > nextBlockedRange.startsAt.getTime()

      if (!hasConflict) {
        available.push(this.timezoneService.formatUtcTimeInTimezone(slotStart, business.timezone))
      }
    }

    return available
  }

  private buildAvailabilityCacheKey(businessId: string, serviceId: string, date: string) {
    return `availability:${businessId}:${serviceId}:${date}`
  }
}
