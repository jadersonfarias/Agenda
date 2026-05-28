import { AppointmentStatus } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import { AppointmentsRepository } from '../../src/appointments/appointments.repository'

describe('AppointmentsRepository', () => {
  it('busca appointment por id com select mínimo e businessId', async () => {
    const prisma = {
      appointment: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as any
    const repository = new AppointmentsRepository(prisma)

    await repository.findById('appointment-1', 'business-1')

    expect(prisma.appointment.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'appointment-1',
        businessId: 'business-1',
      },
      select: {
        id: true,
        businessId: true,
        customerId: true,
        status: true,
        assignedToUserId: true,
      },
    })
  })

  it('atualiza status filtrando por id e businessId', async () => {
    const prisma = {
      appointment: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    } as any
    const repository = new AppointmentsRepository(prisma)

    await expect(
      repository.updateStatus('appointment-1', 'business-1', AppointmentStatus.COMPLETED)
    ).resolves.toEqual({
      id: 'appointment-1',
      status: AppointmentStatus.COMPLETED,
    })

    expect(prisma.appointment.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'appointment-1',
        businessId: 'business-1',
      },
      data: {
        status: AppointmentStatus.COMPLETED,
        completedAt: expect.any(Date),
      },
    })
  })

  it('retorna null ao tentar atualizar status fora do business', async () => {
    const prisma = {
      appointment: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    } as any
    const repository = new AppointmentsRepository(prisma)

    await expect(
      repository.updateStatus('appointment-1', 'business-2', AppointmentStatus.CANCELED)
    ).resolves.toBeNull()
  })

  it('busca token público sem selecionar dados sensíveis', async () => {
    const prisma = {
      appointment: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    } as any
    const repository = new AppointmentsRepository(prisma)

    await repository.findByPublicToken('token-1')

    expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
      where: { publicToken: 'token-1' },
      select: {
        id: true,
        publicToken: true,
        scheduledAt: true,
        status: true,
        price: true,
        businessId: true,
        customerId: true,
        service: {
          select: {
            name: true,
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
      },
    })
  })

  it('busca appointments públicos com filtro estreito por telefone e businessId', async () => {
    const prisma = {
      customer: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'customer-1',
            phone: '+55 (48) 99680-3757',
            businessId: 'business-1',
          },
          {
            id: 'customer-2',
            phone: '(11) 98888-7777',
            businessId: 'business-1',
          },
        ]),
      },
      appointment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any
    const repository = new AppointmentsRepository(prisma)

    await repository.findPublicByCustomerPhoneLookup({
      rawPhoneCandidates: ['+55 (48) 99680-3757', '(48) 99680-3757', '48996803757'],
      normalizedPhoneVariants: ['5548996803757', '48996803757', '8996803757'],
      startsAtOrAfter: new Date('2026-05-11T18:00:00.000Z'),
      businessId: 'business-1',
    })

    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      where: {
        businessId: 'business-1',
        phone: {
          in: ['+55 (48) 99680-3757', '(48) 99680-3757', '48996803757'],
        },
      },
      select: {
        id: true,
        phone: true,
        businessId: true,
      },
    })

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          businessId: 'business-1',
          scheduledAt: {
            gte: new Date('2026-05-11T18:00:00.000Z'),
          },
          customerId: {
            in: ['customer-1'],
          },
        },
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      })
    )
  })

  it('não retorna appointments de outro business', async () => {
    const prisma = {
      customer: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'customer-1',
            phone: '(48) 99680-3757',
            businessId: 'business-2',
          },
        ]),
      },
      appointment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any
    const repository = new AppointmentsRepository(prisma)

    const result = await repository.findPublicByCustomerPhoneLookup({
      rawPhoneCandidates: ['(48) 99680-3757'],
      normalizedPhoneVariants: ['48996803757'],
      startsAtOrAfter: new Date('2026-05-11T18:00:00.000Z'),
      businessId: 'business-1',
    })

    expect(result).toEqual([])
    expect(prisma.appointment.findMany).not.toHaveBeenCalled()
  })

  it('busca appointments quando o telefone sem máscara bate com candidato exato', async () => {
    const prisma = {
      customer: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'customer-1',
            phone: '48996803757',
            businessId: 'business-1',
          },
        ]),
      },
      appointment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any
    const repository = new AppointmentsRepository(prisma)

    await repository.findPublicByCustomerPhoneLookup({
      rawPhoneCandidates: ['+55 (48) 99680-3757', '(48) 99680-3757', '48996803757'],
      normalizedPhoneVariants: ['5548996803757', '48996803757', '8996803757'],
      startsAtOrAfter: new Date('2026-05-11T18:00:00.000Z'),
      businessId: 'business-1',
    })

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          businessId: 'business-1',
          scheduledAt: {
            gte: new Date('2026-05-11T18:00:00.000Z'),
          },
          customerId: {
            in: ['customer-1'],
          },
        },
      })
    )
  })

  it('filtra apenas appointments SCHEDULED quando statusFilter=scheduled', async () => {
    const prisma = {
      appointment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any
    const repository = new AppointmentsRepository(prisma)

    await repository.findMany({
      businessId: 'business-1',
      statusFilter: 'scheduled',
    })

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          businessId: 'business-1',
          status: {
            in: [AppointmentStatus.SCHEDULED],
          },
        },
      })
    )
  })

  it('filtra apenas appointments COMPLETED quando statusFilter=completed', async () => {
    const prisma = {
      appointment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any
    const repository = new AppointmentsRepository(prisma)

    await repository.findMany({
      businessId: 'business-1',
      statusFilter: 'completed',
    })

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          businessId: 'business-1',
          status: {
            in: [AppointmentStatus.COMPLETED],
          },
        },
      })
    )
  })

  it('filtra apenas appointments CANCELED quando statusFilter=canceled', async () => {
    const prisma = {
      appointment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any
    const repository = new AppointmentsRepository(prisma)

    await repository.findMany({
      businessId: 'business-1',
      statusFilter: 'canceled',
    })

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          businessId: 'business-1',
          status: {
            in: [AppointmentStatus.CANCELED],
          },
        },
      })
    )
  })

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
