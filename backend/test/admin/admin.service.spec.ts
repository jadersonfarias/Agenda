import { describe, expect, it, vi } from 'vitest'
import { AdminService } from '../../src/admin/admin.service'
import { adminServiceSchema } from '../../src/admin/admin.schema'

function createAdminService({
  adminRepository = {} as any,
  businessesRepository = {} as any,
  appointmentsService = {} as any,
  availabilityCacheService = {} as any,
  subscriptionService = {
    assertBusinessCanWrite: vi.fn().mockResolvedValue(undefined),
  } as any,
} = {}) {
  return new AdminService(
    adminRepository,
    businessesRepository,
    appointmentsService,
    availabilityCacheService,
    subscriptionService,
  )
}

describe('AdminService financial data', () => {
  it('cria serviço com description opcional', async () => {
    const createdAt = new Date('2026-05-20T12:00:00.000Z')
    const adminRepository = {
      createService: vi.fn().mockResolvedValue({
        id: 'service-1',
        name: 'Barba completa',
        description: 'Acabamento com toalha quente e finalização.',
        price: { toString: () => '95' },
        durationMinutes: 45,
        createdAt,
        _count: { appointments: 0 },
      }),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
    } as any
    const service = createAdminService({
      adminRepository,
      businessesRepository,
    })
    const dto = adminServiceSchema.parse({
      businessId: 'business-1',
      name: 'Barba completa',
      description: 'Acabamento com toalha quente e finalização.',
      price: 95,
      durationMinutes: 45,
    })

    await expect(service.createService('business-1', dto)).resolves.toEqual({
      id: 'service-1',
      name: 'Barba completa',
      description: 'Acabamento com toalha quente e finalização.',
      price: '95',
      durationMinutes: 45,
      appointmentCount: 0,
      createdAt: createdAt.toISOString(),
    })

    expect(adminRepository.createService).toHaveBeenCalledWith({
      businessId: 'business-1',
      name: 'Barba completa',
      description: 'Acabamento com toalha quente e finalização.',
      price: 95,
      durationMinutes: 45,
    })
  })

  it('cria serviço sem description salvando null', async () => {
    const createdAt = new Date('2026-05-20T12:00:00.000Z')
    const adminRepository = {
      createService: vi.fn().mockResolvedValue({
        id: 'service-1',
        name: 'Corte',
        description: null,
        price: { toString: () => '80' },
        durationMinutes: 60,
        createdAt,
        _count: { appointments: 0 },
      }),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
    } as any
    const service = createAdminService({
      adminRepository,
      businessesRepository,
    })
    const dto = adminServiceSchema.parse({
      businessId: 'business-1',
      name: 'Corte',
      price: 80,
      durationMinutes: 60,
    })

    await expect(service.createService('business-1', dto)).resolves.toEqual({
      id: 'service-1',
      name: 'Corte',
      description: null,
      price: '80',
      durationMinutes: 60,
      appointmentCount: 0,
      createdAt: createdAt.toISOString(),
    })

    expect(adminRepository.createService).toHaveBeenCalledWith({
      businessId: 'business-1',
      name: 'Corte',
      description: null,
      price: 80,
      durationMinutes: 60,
    })
  })

  it('edita description do serviço', async () => {
    const createdAt = new Date('2026-05-20T12:00:00.000Z')
    const adminRepository = {
      findServiceByIdAndBusinessId: vi.fn().mockResolvedValue({
        id: 'service-1',
        _count: { appointments: 0 },
      }),
      updateService: vi.fn().mockResolvedValue({
        id: 'service-1',
        name: 'Corte premium',
        description: 'Corte com lavagem e finalização.',
        price: { toString: () => '120' },
        durationMinutes: 75,
        createdAt,
        _count: { appointments: 2 },
      }),
    } as any
    const service = createAdminService({ adminRepository })
    const dto = adminServiceSchema.parse({
      businessId: 'business-1',
      name: 'Corte premium',
      description: 'Corte com lavagem e finalização.',
      price: 120,
      durationMinutes: 75,
    })

    await expect(service.updateService('service-1', 'business-1', dto)).resolves.toEqual({
      id: 'service-1',
      name: 'Corte premium',
      description: 'Corte com lavagem e finalização.',
      price: '120',
      durationMinutes: 75,
      appointmentCount: 2,
      createdAt: createdAt.toISOString(),
    })

    expect(adminRepository.updateService).toHaveBeenCalledWith('service-1', 'business-1', {
      name: 'Corte premium',
      description: 'Corte com lavagem e finalização.',
      price: 120,
      durationMinutes: 75,
    })
  })

  it('limpa description do serviço salvando null', async () => {
    const createdAt = new Date('2026-05-20T12:00:00.000Z')
    const adminRepository = {
      findServiceByIdAndBusinessId: vi.fn().mockResolvedValue({
        id: 'service-1',
        _count: { appointments: 0 },
      }),
      updateService: vi.fn().mockResolvedValue({
        id: 'service-1',
        name: 'Corte',
        description: null,
        price: { toString: () => '80' },
        durationMinutes: 60,
        createdAt,
        _count: { appointments: 0 },
      }),
    } as any
    const service = createAdminService({ adminRepository })
    const dto = adminServiceSchema.parse({
      businessId: 'business-1',
      name: 'Corte',
      description: '   ',
      price: 80,
      durationMinutes: 60,
    })

    await expect(service.updateService('service-1', 'business-1', dto)).resolves.toEqual({
      id: 'service-1',
      name: 'Corte',
      description: null,
      price: '80',
      durationMinutes: 60,
      appointmentCount: 0,
      createdAt: createdAt.toISOString(),
    })

    expect(adminRepository.updateService).toHaveBeenCalledWith('service-1', 'business-1', {
      name: 'Corte',
      description: null,
      price: 80,
      durationMinutes: 60,
    })
  })

  it('não aceita description acima de 300 caracteres', () => {
    const parseResult = adminServiceSchema.safeParse({
      businessId: 'business-1',
      name: 'Corte',
      description: 'a'.repeat(301),
      price: 80,
      durationMinutes: 60,
    })

    expect(parseResult.success).toBe(false)
  })

  it('monta o resumo financeiro mensal com clientes ativos e inativos', async () => {
    const adminRepository = {
      countCustomersByBusinessId: vi.fn().mockResolvedValue(10),
      countActiveCustomersByBusinessId: vi.fn().mockResolvedValue(4),
    } as any
    const businessesRepository = {} as any
    const appointmentsService = {
      getMonthlyRevenue: vi.fn().mockResolvedValue({
        month: '2026-05',
        totalRevenue: 320,
        completedAppointments: 4,
        averageTicket: 80,
      }),
    } as any

    const service = createAdminService({
      adminRepository,
      appointmentsService,
    })

    await expect(service.getMonthlySummary('business-1', '2026-05')).resolves.toEqual({
      month: '2026-05',
      totalRevenue: 320,
      completedAppointments: 4,
      averageTicket: 80,
      activeCustomers: 4,
      inactiveCustomers: 6,
      activeCustomerWindowDays: 30,
    })
  })

  it('monta o relatório financeiro agrupando receita por serviço', async () => {
    const adminRepository = {
      countCanceledAppointmentsInRange: vi.fn().mockResolvedValue(2),
      listCompletedAppointmentsInRangeByService: vi.fn().mockResolvedValue([
        {
          serviceId: 'service-2',
          price: { toString: () => '60' },
          service: { name: 'Bigode' },
        },
        {
          serviceId: 'service-1',
          price: { toString: () => '80' },
          service: { name: 'Corte' },
        },
        {
          serviceId: 'service-1',
          price: { toString: () => '80' },
          service: { name: 'Corte' },
        },
      ]),
    } as any
    const businessesRepository = {} as any
    const appointmentsService = {
      getMonthlyRevenue: vi.fn().mockResolvedValue({
        month: '2026-05',
        totalRevenue: 220,
        completedAppointments: 3,
        averageTicket: 73.33,
      }),
    } as any

    const service = createAdminService({
      adminRepository,
      appointmentsService,
    })

    await expect(service.getFinancialReport('business-1', '2026-05')).resolves.toEqual({
      month: '2026-05',
      revenueTotal: 220,
      appointmentsCompleted: 3,
      averageTicket: 73.33,
      cancellationsCount: 2,
      revenueByService: [
        {
          serviceId: 'service-1',
          serviceName: 'Corte',
          revenueTotal: 160,
          appointmentsCompleted: 2,
        },
        {
          serviceId: 'service-2',
          serviceName: 'Bigode',
          revenueTotal: 60,
          appointmentsCompleted: 1,
        },
      ],
      topServices: [
        {
          serviceId: 'service-1',
          serviceName: 'Corte',
          revenueTotal: 160,
          appointmentsCompleted: 2,
        },
        {
          serviceId: 'service-2',
          serviceName: 'Bigode',
          revenueTotal: 60,
          appointmentsCompleted: 1,
        },
      ],
    })
  })

  it('não exclui serviço com agendamentos vinculados', async () => {
    const adminRepository = {
      findServiceByIdAndBusinessId: vi.fn().mockResolvedValue({
        id: 'service-1',
        _count: {
          appointments: 1,
        },
      }),
    } as any

    const service = createAdminService({
      adminRepository,
    })

    await expect(service.deleteService('service-1', 'business-1')).rejects.toThrow(
      'Serviços com agendamentos vinculados não podem ser excluídos'
    )
  })

  it('atualiza horários do negócio e limpa o cache de disponibilidade', async () => {
    const deleteByPrefix = vi.fn()
    const adminRepository = {
      updateBusinessAvailability: vi.fn().mockResolvedValue({
        id: 'business-1',
        name: 'Negócio',
        slug: 'negocio',
        openTime: '08:00',
        closeTime: '19:00',
      }),
    } as any

    const service = createAdminService({
      adminRepository,
      availabilityCacheService: { deleteByPrefix } as any,
    })

    await expect(
      service.updateBusinessAvailability('business-1', {
        businessId: 'business-1',
        openTime: '08:00',
        closeTime: '19:00',
      })
    ).resolves.toEqual({
      id: 'business-1',
      name: 'Negócio',
      slug: 'negocio',
      openTime: '08:00',
      closeTime: '19:00',
    })

    expect(deleteByPrefix).toHaveBeenCalledWith('availability:business-1:')
  })

  it('mantém leitura permitida sem validar assinatura', async () => {
    const subscriptionService = {
      assertBusinessCanWrite: vi.fn(),
    }
    const adminRepository = {
      listServicesByBusinessId: vi.fn().mockResolvedValue([
        {
          id: 'service-1',
          name: 'Corte',
          description: 'Corte com acabamento.',
          price: { toString: () => '80' },
          durationMinutes: 60,
          createdAt: new Date('2026-05-20T12:00:00.000Z'),
          _count: { appointments: 0 },
        },
      ]),
    } as any
    const service = createAdminService({
      adminRepository,
      subscriptionService: subscriptionService as any,
    })

    await expect(service.listServices('business-1')).resolves.toEqual([
      {
        id: 'service-1',
        name: 'Corte',
        description: 'Corte com acabamento.',
        price: '80',
        durationMinutes: 60,
        appointmentCount: 0,
        createdAt: '2026-05-20T12:00:00.000Z',
      },
    ])

    expect(subscriptionService.assertBusinessCanWrite).not.toHaveBeenCalled()
  })
})
