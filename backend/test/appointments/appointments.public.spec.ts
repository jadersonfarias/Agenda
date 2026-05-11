import { AppointmentStatus } from '@prisma/client'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppointmentsService } from '../../src/appointments/appointments.service'

describe('AppointmentsService public routes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T18:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('busca agendamentos públicos por telefone com variações normalizadas', async () => {
    const appointmentsRepository = {
      findPublicByCustomerPhoneVariants: vi.fn().mockResolvedValue([
        {
          id: 'appointment-1',
          publicToken: 'token-1',
          scheduledAt: new Date('2026-05-12T14:00:00.000Z'),
          status: AppointmentStatus.SCHEDULED,
          price: { toString: () => '80' },
          service: { name: 'Corte de cabelo' },
        },
      ]),
    } as any
    const businessesRepository = {} as any
    const businessesService = {} as any
    const timezoneService = {} as any

    const service = new AppointmentsService(
      appointmentsRepository,
      businessesRepository,
      businessesService,
      timezoneService
    )

    const result = await service.getByCustomerPhone({ phone: '+55 48 99680 3757' })

    expect(appointmentsRepository.findPublicByCustomerPhoneVariants).toHaveBeenCalledWith([
      '5548996803757',
      '48996803757',
      '8996803757',
    ])
    expect(result).toEqual([
      {
        id: 'appointment-1',
        publicToken: 'token-1',
        serviceName: 'Corte de cabelo',
        scheduledAt: '2026-05-12T14:00:00.000Z',
        status: AppointmentStatus.SCHEDULED,
        price: '80',
      },
    ])
  })

  it('retorna o detalhe público por token com canCancel verdadeiro para agendamento futuro', async () => {
    const appointmentsRepository = {
      findByPublicToken: vi.fn().mockResolvedValue({
        id: 'appointment-1',
        publicToken: 'token-1',
        scheduledAt: new Date('2026-05-12T14:00:00.000Z'),
        status: AppointmentStatus.SCHEDULED,
        price: { toString: () => '80' },
        businessId: 'business-1',
        customerId: 'customer-1',
        service: { name: 'Corte de cabelo' },
        customer: { name: 'Mario' },
      }),
    } as any
    const businessesRepository = {} as any
    const businessesService = {} as any
    const timezoneService = {} as any

    const service = new AppointmentsService(
      appointmentsRepository,
      businessesRepository,
      businessesService,
      timezoneService
    )

    await expect(service.getPublicByToken({ token: 'token-1' })).resolves.toEqual({
      token: 'token-1',
      service: 'Corte de cabelo',
      customerName: 'Mario',
      scheduledAt: '2026-05-12T14:00:00.000Z',
      price: '80',
      status: AppointmentStatus.SCHEDULED,
      canCancel: true,
    })
  })

  it('não permite cancelar agendamento público que não pode mais ser cancelado', async () => {
    const appointmentsRepository = {
      findByPublicToken: vi.fn().mockResolvedValue({
        id: 'appointment-1',
        publicToken: 'token-1',
        scheduledAt: new Date('2026-05-10T14:00:00.000Z'),
        status: AppointmentStatus.COMPLETED,
        price: { toString: () => '80' },
        businessId: 'business-1',
        customerId: 'customer-1',
        service: { name: 'Corte de cabelo' },
        customer: { name: 'Mario' },
      }),
    } as any
    const businessesRepository = {} as any
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

    await expect(service.cancelPublicAppointment({ token: 'token-1' })).rejects.toThrowError(BadRequestException)
  })

  it('lança NotFound ao consultar token público inexistente', async () => {
    const appointmentsRepository = {
      findByPublicToken: vi.fn().mockResolvedValue(null),
    } as any
    const businessesRepository = {} as any
    const businessesService = {} as any
    const timezoneService = {} as any

    const service = new AppointmentsService(
      appointmentsRepository,
      businessesRepository,
      businessesService,
      timezoneService
    )

    await expect(service.getPublicByToken({ token: 'inexistente' })).rejects.toThrowError(NotFoundException)
  })
})
