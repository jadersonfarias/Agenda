import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { AdminService } from '../../src/admin/admin.service'
import { RoleGuard } from '../../src/auth/role.guard'

function createService(adminRepositoryOverrides: Record<string, unknown>) {
  const adminRepository = {
    findUserByEmail: vi.fn(),
    findMembershipByUserAndBusinessId: vi.fn(),
    findPendingInvitationByBusinessAndEmail: vi.fn(),
    findInvitationByToken: vi.fn(),
    createInvitation: vi.fn(),
    acceptInvitation: vi.fn(),
    ...adminRepositoryOverrides,
  } as any

  return {
    adminRepository,
    service: new AdminService(adminRepository, {} as any, {} as any),
  }
}

function createOwnerOnlyContext(role: 'OWNER' | 'ADMIN' | 'STAFF') {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(['OWNER']),
  } as any
  const guard = new RoleGuard(reflector)
  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        businessId: 'business-1',
        user: {
          id: 'user-1',
          memberships: [{ businessId: 'business-1', role }],
        },
      }),
    }),
  } as any

  return { guard, context }
}

describe('Invitation rules', () => {
  it('OWNER cria convite com token, expiração e link', async () => {
    const expiresAt = new Date('2026-05-18T12:00:00.000Z')
    const createdAt = new Date('2026-05-11T12:00:00.000Z')
    const { adminRepository, service } = createService({
      findUserByEmail: vi.fn().mockResolvedValue(null),
      findPendingInvitationByBusinessAndEmail: vi.fn().mockResolvedValue(null),
      findInvitationByToken: vi.fn().mockResolvedValue(null),
      createInvitation: vi.fn().mockImplementation(async (input) => ({
        id: 'invitation-1',
        email: input.email,
        role: input.role,
        token: input.token,
        expiresAt,
        acceptedAt: null,
        createdAt,
      })),
    })

    const result = await service.createInvitation('business-1', {
      businessId: 'business-1',
      email: 'novo@example.com',
      role: 'STAFF',
    })

    expect(adminRepository.createInvitation).toHaveBeenCalledWith({
      businessId: 'business-1',
      email: 'novo@example.com',
      role: 'STAFF',
      token: expect.any(String),
      expiresAt: expect.any(Date),
    })
    expect(result).toMatchObject({
      id: 'invitation-1',
      email: 'novo@example.com',
      role: 'STAFF',
      invitationLink: expect.stringContaining('/invite/'),
      isExpired: false,
    })
  })

  it('não OWNER não cria convite', () => {
    const { guard, context } = createOwnerOnlyContext('STAFF')

    expect(() => guard.canActivate(context)).toThrowError(ForbiddenException)
    expect(() => guard.canActivate(context)).toThrowError('Usuário sem permissão para este negócio')
  })

  it('não duplica convite pendente para mesmo email/business', async () => {
    const { adminRepository, service } = createService({
      findUserByEmail: vi.fn().mockResolvedValue(null),
      findPendingInvitationByBusinessAndEmail: vi.fn().mockResolvedValue({ id: 'invitation-1' }),
    })

    await expect(
      service.createInvitation('business-1', {
        businessId: 'business-1',
        email: 'novo@example.com',
        role: 'STAFF',
      })
    ).rejects.toThrowError(ConflictException)
    await expect(
      service.createInvitation('business-1', {
        businessId: 'business-1',
        email: 'novo@example.com',
        role: 'STAFF',
      })
    ).rejects.toThrowError('Já existe um convite pendente para este email')
    expect(adminRepository.createInvitation).not.toHaveBeenCalled()
  })

  it('não convida usuário que já é membro do business', async () => {
    const { adminRepository, service } = createService({
      findUserByEmail: vi.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Usuário',
        email: 'membro@example.com',
      }),
      findMembershipByUserAndBusinessId: vi.fn().mockResolvedValue({
        id: 'membership-1',
        role: 'STAFF',
      }),
    })

    await expect(
      service.createInvitation('business-1', {
        businessId: 'business-1',
        email: 'membro@example.com',
        role: 'STAFF',
      })
    ).rejects.toThrowError(ConflictException)
    await expect(
      service.createInvitation('business-1', {
        businessId: 'business-1',
        email: 'membro@example.com',
        role: 'STAFF',
      })
    ).rejects.toThrowError('Usuário já é membro deste negócio')
    expect(adminRepository.createInvitation).not.toHaveBeenCalled()
  })

  it('aceitar convite expirado falha', async () => {
    const { adminRepository, service } = createService({
      findInvitationByToken: vi.fn().mockResolvedValue({
        id: 'invitation-1',
        businessId: 'business-1',
        email: 'novo@example.com',
        role: 'STAFF',
        token: 'token-1',
        expiresAt: new Date('2020-01-01T00:00:00.000Z'),
        acceptedAt: null,
        createdAt: new Date('2019-12-25T00:00:00.000Z'),
        business: {
          id: 'business-1',
          name: 'Negócio',
          slug: 'negocio',
        },
      }),
    })

    await expect(
      service.acceptInvitation('token-1', {
        name: 'Novo Usuário',
        password: 'password123',
      })
    ).rejects.toThrowError(BadRequestException)
    await expect(
      service.acceptInvitation('token-1', {
        name: 'Novo Usuário',
        password: 'password123',
      })
    ).rejects.toThrowError('Este convite expirou')
    expect(adminRepository.acceptInvitation).not.toHaveBeenCalled()
  })

  it('aceitar convite válido cria membership', async () => {
    const acceptedAt = new Date('2026-05-11T12:30:00.000Z')
    const { adminRepository, service } = createService({
      findInvitationByToken: vi.fn().mockResolvedValue({
        id: 'invitation-1',
        businessId: 'business-1',
        email: 'novo@example.com',
        role: 'STAFF',
        token: 'token-1',
        expiresAt: new Date('2999-01-01T00:00:00.000Z'),
        acceptedAt: null,
        createdAt: new Date('2026-05-11T12:00:00.000Z'),
        business: {
          id: 'business-1',
          name: 'Negócio',
          slug: 'negocio',
        },
      }),
      findUserByEmail: vi.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Usuário',
        email: 'novo@example.com',
      }),
      findMembershipByUserAndBusinessId: vi.fn().mockResolvedValue(null),
      acceptInvitation: vi.fn().mockResolvedValue({
        invitation: {
          id: 'invitation-1',
          email: 'novo@example.com',
          role: 'STAFF',
          token: 'token-1',
          expiresAt: new Date('2999-01-01T00:00:00.000Z'),
          acceptedAt,
          createdAt: new Date('2026-05-11T12:00:00.000Z'),
        },
        membership: {
          id: 'membership-1',
          role: 'STAFF',
          createdAt: new Date('2026-05-11T12:30:00.000Z'),
          updatedAt: new Date('2026-05-11T12:30:00.000Z'),
          user: {
            id: 'user-1',
            name: 'Usuário',
            email: 'novo@example.com',
          },
        },
      }),
    })

    const result = await service.acceptInvitation('token-1', {})

    expect(adminRepository.acceptInvitation).toHaveBeenCalledWith({
      invitationId: 'invitation-1',
      businessId: 'business-1',
      email: 'novo@example.com',
      role: 'STAFF',
      existingUserId: 'user-1',
      name: undefined,
      hashedPassword: undefined,
    })
    expect(result.membership).toMatchObject({
      id: 'membership-1',
      role: 'STAFF',
      user: {
        id: 'user-1',
        email: 'novo@example.com',
      },
    })
  })

  it('aceitar convite marca acceptedAt', async () => {
    const acceptedAt = new Date('2026-05-11T12:30:00.000Z')
    const { service } = createService({
      findInvitationByToken: vi.fn().mockResolvedValue({
        id: 'invitation-1',
        businessId: 'business-1',
        email: 'novo@example.com',
        role: 'STAFF',
        token: 'token-1',
        expiresAt: new Date('2999-01-01T00:00:00.000Z'),
        acceptedAt: null,
        createdAt: new Date('2026-05-11T12:00:00.000Z'),
        business: {
          id: 'business-1',
          name: 'Negócio',
          slug: 'negocio',
        },
      }),
      findUserByEmail: vi.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Usuário',
        email: 'novo@example.com',
      }),
      findMembershipByUserAndBusinessId: vi.fn().mockResolvedValue(null),
      acceptInvitation: vi.fn().mockResolvedValue({
        invitation: {
          id: 'invitation-1',
          email: 'novo@example.com',
          role: 'STAFF',
          token: 'token-1',
          expiresAt: new Date('2999-01-01T00:00:00.000Z'),
          acceptedAt,
          createdAt: new Date('2026-05-11T12:00:00.000Z'),
        },
        membership: {
          id: 'membership-1',
          role: 'STAFF',
          createdAt: new Date('2026-05-11T12:30:00.000Z'),
          updatedAt: new Date('2026-05-11T12:30:00.000Z'),
          user: {
            id: 'user-1',
            name: 'Usuário',
            email: 'novo@example.com',
          },
        },
      }),
    })

    const result = await service.acceptInvitation('token-1', {})

    expect(result.invitation.acceptedAt).toBe('2026-05-11T12:30:00.000Z')
  })
})
