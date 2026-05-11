import { AppointmentStatus } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import { BusinessesRepository } from '../../src/businesses/businesses.repository'

describe('BusinessesRepository', () => {
  it('ignora appointments CANCELED ao buscar conflitos de disponibilidade', async () => {
    const prisma = {
      appointment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any
    const repository = new BusinessesRepository(prisma)
    const rangeStart = new Date('2026-05-12T12:00:00.000Z')
    const rangeEnd = new Date('2026-05-12T15:00:00.000Z')

    await repository.findAppointmentsInRange({
      businessId: 'business-1',
      rangeStart,
      rangeEnd,
    })

    expect(prisma.appointment.findMany).toHaveBeenCalledWith({
      where: {
        businessId: 'business-1',
        status: {
          not: AppointmentStatus.CANCELED,
        },
        scheduledAt: { lt: rangeEnd },
        endsAt: { gt: rangeStart },
      },
      select: {
        scheduledAt: true,
        endsAt: true,
      },
      orderBy: { scheduledAt: 'asc' },
    })
  })
})
