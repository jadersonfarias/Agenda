import { BadRequestException, Injectable } from '@nestjs/common'
import { BusinessesRepository } from './businesses.repository'
import { AvailabilityCacheService } from '../scheduling/availability-cache.service'
import { TimezoneService } from '../scheduling/timezone.service'

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

@Injectable()
export class BusinessesService {
  constructor(
    private readonly businessesRepository: BusinessesRepository,
    private readonly timezoneService: TimezoneService,
    private readonly availabilityCacheService: AvailabilityCacheService
  ) {}

  async getServices(businessId: string) {
    const business = await this.businessesRepository.findBusinessById(businessId)
    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    return this.businessesRepository.findServices(business.id)
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
    const available: string[] = []
    const durationMs = service.durationMinutes * 60_000
    const slotStepMs = durationMs

    let appointmentIndex = 0

    for (let currentTime = openDateUtc.getTime(); currentTime + durationMs <= closeDateUtc.getTime(); currentTime += slotStepMs) {
      const slotStart = new Date(currentTime)
      const slotEnd = new Date(slotStart.getTime() + durationMs)

      while (
        appointmentIndex < appointments.length &&
        new Date(appointments[appointmentIndex].endsAt).getTime() <= slotStart.getTime()
      ) {
        appointmentIndex += 1
      }

      const nextAppointment = appointments[appointmentIndex]
      const hasConflict =
        Boolean(nextAppointment) &&
        slotStart.getTime() < new Date(nextAppointment.endsAt).getTime() &&
        slotEnd.getTime() > new Date(nextAppointment.scheduledAt).getTime()

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
