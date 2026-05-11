import { AppointmentStatus } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import { AppointmentsRepository } from '../../src/appointments/appointments.repository'

describe('AppointmentsRepository', () => {
  it('considera apenas appointments COMPLETED no faturamento mensal', async () => {
    const prisma = {
      appointment: {
        aggregate: vi.fn().mockResolvedValue({
          _sum: { price: 150 },
          _count: { _all: 2 },
        }),
      },
    } as any
    const repository = new AppointmentsRepository(prisma)
    const rangeStart = new Date('2026-05-01T00:00:00.000Z')
    const rangeEnd = new Date('2026-06-01T00:00:00.000Z')

    await repository.aggregateMonthlyRevenue({
      businessId: 'business-1',
      rangeStart,
      rangeEnd,
    })

    expect(prisma.appointment.aggregate).toHaveBeenCalledWith({
      where: {
        businessId: 'business-1',
        status: AppointmentStatus.COMPLETED,
        completedAt: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },
      _sum: {
        price: true,
      },
      _count: {
        _all: true,
      },
    })
  })
})
