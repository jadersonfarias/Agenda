import { AppointmentStatus } from '@prisma/client'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
      findPublicByCustomerPhoneLookup: vi.fn().mockResolvedValue([
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
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
    } as any
    const businessesService = {} as any
    const timezoneService = {} as any

    const service = createAppointmentsService({
      appointmentsRepository,
      businessesRepository,
      businessesService,
      timezoneService,
    })

    const result = await service.getByCustomerPhone({
      phone: '+55 48 99680 3757',
      businessId: 'business-1',
    })

    expect(businessesRepository.findBusinessById).toHaveBeenCalledWith('business-1')
    expect(appointmentsRepository.findPublicByCustomerPhoneLookup).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        normalizedPhoneVariants: ['5548996803757', '48996803757', '8996803757'],
        startsAtOrAfter: new Date('2026-05-11T18:00:00.000Z'),
        rawPhoneCandidates: expect.arrayContaining([
          '+55 48 99680 3757',
          '5548996803757',
          '(48) 99680-3757',
        ]),
      })
    )
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

  it('busca apenas appointments do business informado', async () => {
    const appointmentsRepository = {
      findPublicByCustomerPhoneLookup: vi.fn().mockResolvedValue([]),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
    } as any

    const service = createAppointmentsService({
      appointmentsRepository,
      businessesRepository,
    })

    const result = await service.getByCustomerPhone({
      phone: '(48) 99680-3757',
      businessId: 'business-public-slug',
    })

    expect(businessesRepository.findBusinessById).toHaveBeenCalledWith('business-public-slug')
    expect(appointmentsRepository.findPublicByCustomerPhoneLookup).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        startsAtOrAfter: new Date('2026-05-11T18:00:00.000Z'),
      })
    )
    expect(result).toEqual([])
  })

  it('inclui variações com código do Brasil ao buscar por telefone local', async () => {
    const appointmentsRepository = {
      findPublicByCustomerPhoneLookup: vi.fn().mockResolvedValue([]),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
    } as any

    const service = createAppointmentsService({
      appointmentsRepository,
      businessesRepository,
    })

    await service.getByCustomerPhone({
      phone: '(48) 99680-3757',
      businessId: 'business-1',
    })

    expect(appointmentsRepository.findPublicByCustomerPhoneLookup).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        normalizedPhoneVariants: ['48996803757', '5548996803757', '8996803757'],
        startsAtOrAfter: new Date('2026-05-11T18:00:00.000Z'),
        rawPhoneCandidates: expect.arrayContaining([
          '(48) 99680-3757',
          '+55 48 99680 3757',
          '(48) 9 9680-3757',
        ]),
      })
    )
  })

  it('mantém busca por telefone sem máscara dentro do business informado', async () => {
    const appointmentsRepository = {
      findPublicByCustomerPhoneLookup: vi.fn().mockResolvedValue([]),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
    } as any

    const service = createAppointmentsService({
      appointmentsRepository,
      businessesRepository,
    })

    await service.getByCustomerPhone({
      phone: '48996803757',
      businessId: 'business-1',
    })

    expect(appointmentsRepository.findPublicByCustomerPhoneLookup).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        normalizedPhoneVariants: ['48996803757', '5548996803757', '8996803757'],
        rawPhoneCandidates: expect.arrayContaining([
          '48996803757',
          '(48) 99680-3757',
          '+55 (48) 99680-3757',
        ]),
      })
    )
  })

  it('retorna lista vazia quando nenhum agendamento é encontrado', async () => {
    const appointmentsRepository = {
      findPublicByCustomerPhoneLookup: vi.fn().mockResolvedValue([]),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
    } as any

    const service = createAppointmentsService({
      appointmentsRepository,
      businessesRepository,
    })

    await expect(service.getByCustomerPhone({
      phone: '(11) 90000-0000',
      businessId: 'business-1',
    })).resolves.toEqual([])
  })

  it('retorna lista vazia sem consultar clientes quando businessId não é informado', async () => {
    const appointmentsRepository = {
      findPublicByCustomerPhoneLookup: vi.fn().mockResolvedValue([]),
    } as any

    const service = createAppointmentsService({
      appointmentsRepository,
    })

    await expect(service.getByCustomerPhone({ phone: '(11) 90000-0000' })).resolves.toEqual([])
    expect(appointmentsRepository.findPublicByCustomerPhoneLookup).not.toHaveBeenCalled()
  })

  it('mantém a criação pública de appointment com isolamento por business e serviço', async () => {
    const createdAppointment = {
      id: 'appointment-1',
      publicToken: 'token-1',
    }
    const appointmentsRepository = {
      findConflicts: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(createdAppointment),
    } as any
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({
        id: 'business-1',
        timezone: 'America/Sao_Paulo',
      }),
      findServiceById: vi.fn().mockResolvedValue({
        id: 'service-1',
        businessId: 'business-1',
        durationMinutes: 30,
        price: 80,
      }),
      findManualBlockConflict: vi.fn().mockResolvedValue(null),
      findCustomerByPhone: vi.fn().mockResolvedValue(null),
      createCustomer: vi.fn().mockResolvedValue({ id: 'customer-1' }),
    } as any
    const businessesService = {
      invalidateBusinessAvailability: vi.fn(),
    } as any
    const timezoneService = {
      validateAppointmentDateTime: vi.fn().mockReturnValue(
        new Date('2026-07-10T17:00:00.000Z')
      ),
    } as any
    const subscriptionService = {
      assertBusinessCanWrite: vi.fn().mockResolvedValue(undefined),
    } as any
    const service = createAppointmentsService({
      appointmentsRepository,
      businessesRepository,
      businessesService,
      timezoneService,
      subscriptionService,
    })

    await expect(service.create({
      businessId: 'business-1',
      serviceId: 'service-1',
      customerName: 'Cliente Teste',
      phone: '(48) 99999-0000',
      date: '2026-07-10',
      time: '14:00',
    })).resolves.toBe(createdAppointment)

    expect(subscriptionService.assertBusinessCanWrite).toHaveBeenCalledWith('business-1')
    expect(appointmentsRepository.create).toHaveBeenCalledWith({
      businessId: 'business-1',
      serviceId: 'service-1',
      customerId: 'customer-1',
      scheduledAt: new Date('2026-07-10T17:00:00.000Z'),
      endsAt: new Date('2026-07-10T17:30:00.000Z'),
      price: 80,
    })
    expect(businessesService.invalidateBusinessAvailability).toHaveBeenCalledWith('business-1')
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

    const service = createAppointmentsService({
      appointmentsRepository,
      businessesRepository,
      businessesService,
      timezoneService,
    })

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

    const service = createAppointmentsService({
      appointmentsRepository,
      businessesRepository,
      businessesService,
      timezoneService,
    })

    await expect(service.cancelPublicAppointment({ token: 'token-1' })).rejects.toThrowError(BadRequestException)
  })

  it('mantém o cancelamento público por token sem aceitar businessId do cliente', async () => {
    const scheduledAppointment = {
      id: 'appointment-1',
      publicToken: 'token-1',
      scheduledAt: new Date('2026-05-12T14:00:00.000Z'),
      status: AppointmentStatus.SCHEDULED,
      price: { toString: () => '80' },
      businessId: 'business-1',
      customerId: 'customer-1',
      service: { name: 'Corte de cabelo' },
      customer: { name: 'Mario' },
    }
    const canceledAppointment = {
      ...scheduledAppointment,
      status: AppointmentStatus.CANCELED,
    }
    const appointmentsRepository = {
      findByPublicToken: vi
        .fn()
        .mockResolvedValueOnce(scheduledAppointment)
        .mockResolvedValueOnce(canceledAppointment),
      updateStatus: vi.fn().mockResolvedValue({
        id: 'appointment-1',
        status: AppointmentStatus.CANCELED,
      }),
    } as any
    const businessesService = {
      invalidateBusinessAvailability: vi.fn(),
    } as any
    const subscriptionService = {
      assertBusinessCanWrite: vi.fn().mockResolvedValue(undefined),
    } as any
    const service = createAppointmentsService({
      appointmentsRepository,
      businessesService,
      subscriptionService,
    })

    await expect(service.cancelPublicAppointment({ token: 'token-1' })).resolves.toEqual({
      token: 'token-1',
      service: 'Corte de cabelo',
      customerName: 'Mario',
      scheduledAt: '2026-05-12T14:00:00.000Z',
      price: '80',
      status: AppointmentStatus.CANCELED,
      canCancel: false,
      canceled: true,
    })
    expect(subscriptionService.assertBusinessCanWrite).toHaveBeenCalledWith('business-1')
    expect(appointmentsRepository.updateStatus).toHaveBeenCalledWith(
      'appointment-1',
      'business-1',
      AppointmentStatus.CANCELED
    )
  })

  it('lança NotFound ao consultar token público inexistente', async () => {
    const appointmentsRepository = {
      findByPublicToken: vi.fn().mockResolvedValue(null),
    } as any
    const businessesRepository = {} as any
    const businessesService = {} as any
    const timezoneService = {} as any

    const service = createAppointmentsService({
      appointmentsRepository,
      businessesRepository,
      businessesService,
      timezoneService,
    })

    await expect(service.getPublicByToken({ token: 'inexistente' })).rejects.toThrowError(NotFoundException)
  })
})
