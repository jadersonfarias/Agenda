import { AppointmentStatus } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import { AppointmentsService } from '../../src/appointments/appointments.service'

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

    const service = new AppointmentsService(
      appointmentsRepository,
      businessesRepository,
      businessesService,
      timezoneService
    )

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
})
