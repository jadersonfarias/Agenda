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
      appointmentsService
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
      appointmentsService
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
})
