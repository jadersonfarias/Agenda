import 'reflect-metadata'
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants'
import { RequestMethod } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { AppointmentsController } from '../../src/appointments/appointments.controller'
import { RATE_LIMIT_KEY } from '../../src/common/rate-limit.decorator'

function getControllerRoutes() {
  return Object.getOwnPropertyNames(AppointmentsController.prototype)
    .filter((methodName) => methodName !== 'constructor')
    .flatMap((methodName) => {
      const handler = (AppointmentsController.prototype as Record<string, unknown>)[methodName]

      if (typeof handler !== 'function') {
        return []
      }

      const path = Reflect.getMetadata(PATH_METADATA, handler)
      const method = Reflect.getMetadata(METHOD_METADATA, handler)

      return path === undefined || method === undefined
        ? []
        : [{ methodName, path, method }]
    })
}

describe('AppointmentsController', () => {
  it('não expõe as rotas administrativas legadas sem autenticação', () => {
    expect(getControllerRoutes()).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/', method: RequestMethod.GET }),
        expect.objectContaining({ path: 'financial/monthly', method: RequestMethod.GET }),
        expect.objectContaining({ path: ':id/status', method: RequestMethod.PATCH }),
        expect.objectContaining({ path: ':id', method: RequestMethod.DELETE }),
      ])
    )

    expect((AppointmentsController.prototype as any).getAll).toBeUndefined()
    expect((AppointmentsController.prototype as any).getMonthlyRevenue).toBeUndefined()
    expect((AppointmentsController.prototype as any).updateStatus).toBeUndefined()
    expect((AppointmentsController.prototype as any).delete).toBeUndefined()
  })

  it('mantém somente os endpoints públicos intencionais de appointments', () => {
    const routes = getControllerRoutes()

    expect(routes).toHaveLength(4)
    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'customer', method: RequestMethod.GET }),
        expect.objectContaining({ path: 'public/:token', method: RequestMethod.GET }),
        expect.objectContaining({ path: '/', method: RequestMethod.POST }),
        expect.objectContaining({ path: 'public/:token/cancel', method: RequestMethod.PATCH }),
      ])
    )
  })

  it('mantém a criação pública delegando dados validados ao service', async () => {
    const appointmentsService = {
      create: vi.fn().mockResolvedValue({ id: 'appointment-1', publicToken: 'token-1' }),
    } as any
    const controller = new AppointmentsController(appointmentsService)
    const body = {
      businessId: 'business-1',
      serviceId: '7d6a73fc-e155-4888-a161-48ca5b9c06c8',
      customerName: 'Cliente Teste',
      phone: '(48) 99999-0000',
      date: '2026-07-10',
      time: '14:00',
    }

    await expect(controller.create(body)).resolves.toEqual({
      id: 'appointment-1',
      publicToken: 'token-1',
    })
    expect(appointmentsService.create).toHaveBeenCalledWith(body)
  })

  it('aplica rate limit na consulta pública de agendamentos por telefone', () => {
    expect(Reflect.getMetadata(RATE_LIMIT_KEY, AppointmentsController.prototype.getByCustomerPhone)).toEqual({
      key: 'appointments-customer-lookup',
      limit: 10,
      windowMs: 60_000,
      message: 'Muitas consultas de agendamentos. Tente novamente em instantes.',
    })
  })

  it('aplica rate limit no detalhe público do agendamento', () => {
    expect(Reflect.getMetadata(RATE_LIMIT_KEY, AppointmentsController.prototype.getPublicByToken)).toEqual({
      key: 'appointments-public-detail',
      limit: 20,
      windowMs: 60_000,
      message: 'Muitas consultas do agendamento. Tente novamente em instantes.',
    })
  })

  it('aplica rate limit no cancelamento público do agendamento', () => {
    expect(Reflect.getMetadata(RATE_LIMIT_KEY, AppointmentsController.prototype.cancelPublicAppointment)).toEqual({
      key: 'appointments-public-cancel',
      limit: 5,
      windowMs: 60_000,
      message: 'Muitas tentativas de cancelamento. Tente novamente em instantes.',
    })
  })
})
