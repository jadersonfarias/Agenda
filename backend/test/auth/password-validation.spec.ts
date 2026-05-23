import { describe, expect, it } from 'vitest'
import { acceptInvitationSchema } from '../../src/admin/admin.schema'
import { registerBusinessOwnerSchema } from '../../src/auth/auth.schema'
import { strongPasswordErrorMessage } from '../../src/common/password-validation'

describe('Password validation', () => {
  it('rejeita senha fraca no cadastro público', () => {
    const result = registerBusinessOwnerSchema.safeParse({
      ownerName: 'Maria Dona',
      email: 'maria@example.com',
      password: 'password123',
      businessName: 'Salão da Maria',
      businessSlug: 'salao-da-maria',
      phone: '(11) 91234-5678',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(strongPasswordErrorMessage)
  })

  it('aceita senha forte no cadastro público', () => {
    const result = registerBusinessOwnerSchema.safeParse({
      ownerName: 'Maria Dona',
      email: 'maria@example.com',
      password: 'Marca@123',
      businessName: 'Salão da Maria',
      businessSlug: 'salao-da-maria',
      phone: '(11) 91234-5678',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita senha fraca no aceite de convite para usuário novo', () => {
    const result = acceptInvitationSchema.safeParse({
      name: 'Novo Usuário',
      password: 'senha123',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(strongPasswordErrorMessage)
  })

  it('aceita senha forte no aceite de convite para usuário novo', () => {
    const result = acceptInvitationSchema.safeParse({
      name: 'Novo Usuário',
      password: 'Marca@123',
    })

    expect(result.success).toBe(true)
  })
})
