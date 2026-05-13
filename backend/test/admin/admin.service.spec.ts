import { describe, expect, it, vi } from 'vitest'
import { AdminService } from '../../src/admin/admin.service'

describe('AdminService financial data', () => {
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

    const service = new AdminService(
      adminRepository,
      businessesRepository,
      appointmentsService,
      {} as any
    )

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

    const service = new AdminService(
      adminRepository,
      businessesRepository,
      appointmentsService,
      {} as any
    )

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

    const service = new AdminService(
      adminRepository,
      {} as any,
      {} as any,
      {} as any
    )

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

    const service = new AdminService(
      adminRepository,
      {} as any,
      {} as any,
      { deleteByPrefix } as any
    )

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
})
