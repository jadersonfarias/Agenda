import 'reflect-metadata'
import { describe, expect, it } from 'vitest'
import { AppointmentsController } from '../../src/appointments/appointments.controller'
import { RATE_LIMIT_KEY } from '../../src/common/rate-limit.decorator'

describe('AppointmentsController', () => {
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
