import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BusinessesService } from '../../src/businesses/businesses.service'

describe('BusinessesService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('considera ManualBlock ao calcular disponibilidade', async () => {
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({
        id: 'business-1',
        openTime: '12:00',
        closeTime: '15:00',
        timezone: 'UTC',
      }),
      findServiceById: vi.fn().mockResolvedValue({
        id: 'service-1',
        businessId: 'business-1',
        durationMinutes: 60,
      }),
      findAppointmentsInRange: vi.fn().mockResolvedValue([]),
    } as any
    const timezoneService = {
      getBusinessHoursWindow: vi.fn().mockReturnValue({
        openDateUtc: new Date('2026-05-12T12:00:00.000Z'),
        closeDateUtc: new Date('2026-05-12T15:00:00.000Z'),
      }),
      formatUtcTimeInTimezone: vi.fn((date: Date) => `${String(date.getUTCHours()).padStart(2, '0')}:00`),
    } as any
    const availabilityCacheService = {
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
      deleteByPrefix: vi.fn(),
    } as any
    const prisma = {
      manualBlock: {
        findMany: vi.fn().mockResolvedValue([
          {
            startsAt: new Date('2026-05-12T13:00:00.000Z'),
            endsAt: new Date('2026-05-12T14:00:00.000Z'),
          },
        ]),
      },
    } as any

    const service = new BusinessesService(
      businessesRepository,
      timezoneService,
      availabilityCacheService,
      prisma
    )

    const availability = await service.getAvailability('business-1', 'service-1', '2026-05-12')

    expect(availability).toEqual(['12:00', '14:00'])
    expect(prisma.manualBlock.findMany).toHaveBeenCalledWith({
      where: {
        businessId: 'business-1',
        startsAt: { lt: new Date('2026-05-12T15:00:00.000Z') },
        endsAt: { gt: new Date('2026-05-12T12:00:00.000Z') },
      },
      select: {
        startsAt: true,
        endsAt: true,
      },
      orderBy: { startsAt: 'asc' },
    })
    expect(availabilityCacheService.set).toHaveBeenCalledWith(
      'availability:business-1:service-1:2026-05-12',
      ['12:00', '14:00']
    )
  })

  it('ignora ManualBlock quando a tabela ainda não existe no banco', async () => {
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({
        id: 'business-1',
        openTime: '12:00',
        closeTime: '15:00',
        timezone: 'UTC',
      }),
      findServiceById: vi.fn().mockResolvedValue({
        id: 'service-1',
        businessId: 'business-1',
        durationMinutes: 60,
      }),
      findAppointmentsInRange: vi.fn().mockResolvedValue([]),
    } as any
    const timezoneService = {
      getBusinessHoursWindow: vi.fn().mockReturnValue({
        openDateUtc: new Date('2026-05-12T12:00:00.000Z'),
        closeDateUtc: new Date('2026-05-12T15:00:00.000Z'),
      }),
      formatUtcTimeInTimezone: vi.fn((date: Date) => `${String(date.getUTCHours()).padStart(2, '0')}:00`),
    } as any
    const availabilityCacheService = {
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
      deleteByPrefix: vi.fn(),
    } as any
    const prisma = {
      manualBlock: {
        findMany: vi.fn().mockRejectedValue({ code: 'P2021' }),
      },
    } as any

    const service = new BusinessesService(
      businessesRepository,
      timezoneService,
      availabilityCacheService,
      prisma
    )

    const availability = await service.getAvailability('business-1', 'service-1', '2026-05-12')

    expect(availability).toEqual(['12:00', '13:00', '14:00'])
  })
})
