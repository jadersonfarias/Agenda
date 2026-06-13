import { AppointmentStatus } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import { BusinessesRepository } from '../../src/businesses/businesses.repository'

describe('BusinessesRepository', () => {
  it('lista serviços públicos retornando description', async () => {
    const services = [
      {
        id: 'service-1',
        name: 'Corte',
        description: 'Corte com acabamento.',
        price: { toString: () => '80' },
        durationMinutes: 60,
      },
    ]
    const prisma = {
      service: {
        findMany: vi.fn().mockResolvedValue(services),
      },
    } as any
    const repository = new BusinessesRepository(prisma)

    await expect(repository.findServices('business-1')).resolves.toEqual(services)

    expect(prisma.service.findMany).toHaveBeenCalledWith({
      where: { businessId: 'business-1' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        durationMinutes: true,
      },
      orderBy: { name: 'asc' },
    })
  })

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
