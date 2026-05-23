import { AppointmentStatus } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import { AppointmentsService } from '../../src/appointments/appointments.service'

function createAppointmentsService({
  appointmentsRepository = {} as any,
  businessesRepository = {} as any,
  businessesService = {} as any,
  timezoneService = {} as any,
  subscriptionService = {
    assertBusinessCanWrite: vi.fn().mockResolvedValue(undefined),
  } as any,
} = {}) {
  return new AppointmentsService(
    appointmentsRepository,
    businessesRepository,
    businessesService,
    timezoneService,
    subscriptionService,
  )
}

describe('AppointmentsService', () => {
  it('atualiza Customer.lastVisitAt ao marcar appointment como COMPLETED', async () => {
    const latestVisitAt = new Date('2026-05-10T15:00:00.000Z')
    const appointmentsRepository = {
      findById: vi.fn().mockResolvedValue({
        id: 'appointment-1',
        customerId: 'customer-1',
      }),
      updateStatus: vi.fn().mockResolvedValue({ id: 'appointment-1' }),
      findLatestCompletedForCustomer: vi.fn().mockResolvedValue({
        scheduledAt: latestVisitAt,
      }),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
      updateCustomerLastVisitAt: vi.fn().mockResolvedValue(undefined),
    } as any
    const businessesService = {
      invalidateBusinessAvailability: vi.fn(),
    } as any
    const timezoneService = {} as any

    const service = createAppointmentsService({
      appointmentsRepository,
      businessesRepository,
      businessesService,
      timezoneService,
    })

    await service.updateStatus('appointment-1', 'business-1', {
      status: AppointmentStatus.COMPLETED,
    })

    expect(appointmentsRepository.updateStatus).toHaveBeenCalledWith(
      'appointment-1',
      'business-1',
      AppointmentStatus.COMPLETED
    )
    expect(appointmentsRepository.findLatestCompletedForCustomer).toHaveBeenCalledWith('customer-1')
    expect(businessesRepository.updateCustomerLastVisitAt).toHaveBeenCalledWith(
      'customer-1',
      latestVisitAt
    )
    expect(businessesService.invalidateBusinessAvailability).toHaveBeenCalledWith('business-1')
  })

  it('OWNER lista todos os appointments do business', async () => {
    const appointmentsRepository = {
      findMany: vi.fn().mockResolvedValue([]),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
    } as any
    const service = createAppointmentsService({ appointmentsRepository, businessesRepository })

    await service.getAllForAdmin('business-1', 'scheduled', null, {
      userId: 'owner-1',
      role: 'OWNER',
    })

    expect(appointmentsRepository.findMany).toHaveBeenCalledWith({
      businessId: 'business-1',
      statusFilter: 'scheduled',
      pagination: null,
      assignedToUserId: undefined,
    })
  })

  it('ADMIN lista todos os appointments do business', async () => {
    const appointmentsRepository = {
      findMany: vi.fn().mockResolvedValue([]),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
    } as any
    const service = createAppointmentsService({ appointmentsRepository, businessesRepository })

    await service.getAllForAdmin('business-1', 'scheduled', null, {
      userId: 'admin-1',
      role: 'ADMIN',
    })

    expect(appointmentsRepository.findMany).toHaveBeenCalledWith({
      businessId: 'business-1',
      statusFilter: 'scheduled',
      pagination: null,
      assignedToUserId: undefined,
    })
  })

  it('STAFF lista apenas appointments atribuídos a ele', async () => {
    const appointmentsRepository = {
      findMany: vi.fn().mockResolvedValue([]),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
    } as any
    const service = createAppointmentsService({ appointmentsRepository, businessesRepository })

    await service.getAllForAdmin('business-1', 'all', null, {
      userId: 'staff-1',
      role: 'STAFF',
    })

    expect(appointmentsRepository.findMany).toHaveBeenCalledWith({
      businessId: 'business-1',
      statusFilter: 'all',
      pagination: null,
      assignedToUserId: 'staff-1',
    })
  })

  it('STAFF não altera status de appointment de outro funcionário', async () => {
    const appointmentsRepository = {
      findById: vi.fn().mockResolvedValue({
        id: 'appointment-1',
        customerId: 'customer-1',
        assignedToUserId: 'staff-2',
      }),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
    } as any
    const service = createAppointmentsService({ appointmentsRepository, businessesRepository })

    await expect(
      service.updateStatusForAdmin(
        'appointment-1',
        'business-1',
        { status: AppointmentStatus.COMPLETED },
        { userId: 'staff-1', role: 'STAFF' }
      )
    ).rejects.toThrow('Usuário sem permissão para este agendamento')
  })

  it('OWNER pode atribuir funcionário ao appointment', async () => {
    const appointmentsRepository = {
      findById: vi.fn().mockResolvedValue({
        id: 'appointment-1',
        customerId: 'customer-1',
        assignedToUserId: null,
      }),
      updateAssignee: vi.fn().mockResolvedValue({
        id: 'appointment-1',
        assignedToUserId: 'staff-1',
      }),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
    } as any
    const service = createAppointmentsService({ appointmentsRepository, businessesRepository })

    await service.updateAssignee('appointment-1', 'business-1', {
      assignedToUserId: 'staff-1',
    })

    expect(appointmentsRepository.updateAssignee).toHaveBeenCalledWith(
      'appointment-1',
      'business-1',
      'staff-1'
    )
  })

  it('agendamentos antigos sem assignedToUserId continuam funcionando para OWNER/ADMIN', async () => {
    const appointmentsRepository = {
      findById: vi.fn().mockResolvedValue({
        id: 'appointment-1',
        customerId: 'customer-1',
        assignedToUserId: null,
      }),
      updateStatus: vi.fn().mockResolvedValue({ id: 'appointment-1' }),
      findLatestCompletedForCustomer: vi.fn().mockResolvedValue(null),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
      updateCustomerLastVisitAt: vi.fn().mockResolvedValue(undefined),
    } as any
    const businessesService = {
      invalidateBusinessAvailability: vi.fn(),
    } as any
    const service = createAppointmentsService({
      appointmentsRepository,
      businessesRepository,
      businessesService,
    })

    await service.updateStatusForAdmin(
      'appointment-1',
      'business-1',
      { status: AppointmentStatus.CANCELED },
      { userId: 'admin-1', role: 'ADMIN' }
    )

    expect(appointmentsRepository.updateStatus).toHaveBeenCalledWith(
      'appointment-1',
      'business-1',
      AppointmentStatus.CANCELED
    )
  })
})
