import { ConflictException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { AuthService } from '../../src/auth/auth.service'

describe('AuthService registerBusinessOwner', () => {
  function createService(overrides: Record<string, unknown> = {}) {
    const authRepository = {
      findUserByEmail: vi.fn().mockResolvedValue(null),
      findBusinessBySlug: vi.fn().mockResolvedValue(null),
      createBusinessOwner: vi.fn(),
      ...overrides,
    } as any

    const service = new AuthService(authRepository, {} as any)

    return { authRepository, service }
  }

  it('cria user, business e membership OWNER', async () => {
    const { authRepository, service } = createService({
      createBusinessOwner: vi.fn().mockResolvedValue({
        user: {
          id: 'user-1',
          name: 'Maria Dona',
          email: 'maria@example.com',
        },
        business: {
          id: 'business-1',
          name: 'Salao da Maria',
          slug: 'salao-da-maria',
          phone: '(11) 91234-5678',
          plan: 'BASIC',
          subscriptionStatus: 'TRIALING',
          trialEndsAt: '2026-05-21T12:00:00.000Z',
        },
        membership: {
          id: 'membership-1',
          role: 'OWNER',
        },
      }),
    })

    await expect(
      service.registerBusinessOwner({
        ownerName: 'Maria Dona',
        email: 'Maria@Example.com',
        password: 'password123',
        businessName: 'Salao da Maria',
        businessSlug: 'Salao-Da-Maria',
        phone: '(11) 91234-5678',
      })
    ).resolves.toEqual({
      user: {
        id: 'user-1',
        name: 'Maria Dona',
        email: 'maria@example.com',
      },
      business: {
        id: 'business-1',
        name: 'Salao da Maria',
        slug: 'salao-da-maria',
        phone: '(11) 91234-5678',
        plan: 'BASIC',
        subscriptionStatus: 'TRIALING',
        trialEndsAt: '2026-05-21T12:00:00.000Z',
      },
      membership: {
        id: 'membership-1',
        role: 'OWNER',
      },
    })

    expect(authRepository.createBusinessOwner).toHaveBeenCalledWith({
      ownerName: 'Maria Dona',
      email: 'maria@example.com',
      hashedPassword: expect.any(String),
      businessName: 'Salao da Maria',
      businessSlug: 'salao-da-maria',
      phone: '(11) 91234-5678',
      plan: 'BASIC',
      subscriptionStatus: 'TRIALING',
      trialEndsAt: expect.any(Date),
    })
  })

  it('impede email duplicado', async () => {
    const { authRepository, service } = createService({
      findUserByEmail: vi.fn().mockResolvedValue({
        id: 'user-1',
      }),
    })

    await expect(
      service.registerBusinessOwner({
        ownerName: 'Maria Dona',
        email: 'maria@example.com',
        password: 'password123',
        businessName: 'Salao da Maria',
        businessSlug: 'salao-da-maria',
        phone: '',
      })
    ).rejects.toThrowError(ConflictException)
    await expect(
      service.registerBusinessOwner({
        ownerName: 'Maria Dona',
        email: 'maria@example.com',
        password: 'password123',
        businessName: 'Salao da Maria',
        businessSlug: 'salao-da-maria',
        phone: '',
      })
    ).rejects.toThrowError('Email já cadastrado')

    expect(authRepository.createBusinessOwner).not.toHaveBeenCalled()
  })

  it('impede slug duplicado', async () => {
    const { authRepository, service } = createService({
      findBusinessBySlug: vi.fn().mockResolvedValue({
        id: 'business-1',
      }),
    })

    await expect(
      service.registerBusinessOwner({
        ownerName: 'Maria Dona',
        email: 'maria@example.com',
        password: 'password123',
        businessName: 'Salao da Maria',
        businessSlug: 'salao-da-maria',
        phone: '',
      })
    ).rejects.toThrowError(ConflictException)
    await expect(
      service.registerBusinessOwner({
        ownerName: 'Maria Dona',
        email: 'maria@example.com',
        password: 'password123',
        businessName: 'Salao da Maria',
        businessSlug: 'salao-da-maria',
        phone: '',
      })
    ).rejects.toThrowError('Slug já cadastrado')

    expect(authRepository.createBusinessOwner).not.toHaveBeenCalled()
  })
})
