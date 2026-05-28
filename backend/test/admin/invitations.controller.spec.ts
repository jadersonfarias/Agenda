import 'reflect-metadata'
import { describe, expect, it } from 'vitest'
import { InvitationsController } from '../../src/admin/admin.controller'
import { RATE_LIMIT_KEY } from '../../src/common/rate-limit.decorator'

describe('InvitationsController', () => {
  it('aplica rate limit na consulta pública do convite', () => {
    expect(Reflect.getMetadata(RATE_LIMIT_KEY, InvitationsController.prototype.getInvitation)).toEqual({
      key: 'invitations-public-detail',
      limit: 20,
      windowMs: 60_000,
      message: 'Muitas consultas de convite. Tente novamente em instantes.',
    })
  })

  it('aplica rate limit no aceite público do convite', () => {
    expect(Reflect.getMetadata(RATE_LIMIT_KEY, InvitationsController.prototype.acceptInvitation)).toEqual({
      key: 'invitations-public-accept',
      limit: 5,
      windowMs: 60_000,
      message: 'Muitas tentativas de aceite de convite. Tente novamente em instantes.',
    })
  })
})
