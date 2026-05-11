import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { AdminService } from '../../src/admin/admin.service'
import { RoleGuard } from '../../src/auth/role.guard'

describe('Membership ownership rules', () => {
  function createService(adminRepositoryOverrides: Record<string, unknown>) {
    const adminRepository = {
      findMembershipByIdAndBusinessId: vi.fn(),
      countOwnersByBusinessId: vi.fn(),
      deleteMembership: vi.fn(),
      updateMembershipRole: vi.fn(),
      findUserByEmail: vi.fn(),
      findMembershipByUserAndBusinessId: vi.fn(),
      createMembership: vi.fn(),
      ...adminRepositoryOverrides,
    } as any

    return {
      adminRepository,
      service: new AdminService(adminRepository, {} as any, {} as any),
    }
  }

  it('não remove o último OWNER', async () => {
    const { adminRepository, service } = createService({
      findMembershipByIdAndBusinessId: vi.fn().mockResolvedValue({
        id: 'membership-1',
        businessId: 'business-1',
        userId: 'user-1',
        role: 'OWNER',
      }),
      countOwnersByBusinessId: vi.fn().mockResolvedValue(1),
    })

    await expect(service.deleteMembership('membership-1', 'business-1')).rejects.toThrowError(BadRequestException)
    await expect(service.deleteMembership('membership-1', 'business-1')).rejects.toThrowError(
      'Não é possível remover o último OWNER'
    )
    expect(adminRepository.deleteMembership).not.toHaveBeenCalled()
  })

  it('não rebaixa o último OWNER', async () => {
    const { adminRepository, service } = createService({
      findMembershipByIdAndBusinessId: vi.fn().mockResolvedValue({
        id: 'membership-1',
        businessId: 'business-1',
        userId: 'user-1',
        role: 'OWNER',
      }),
      countOwnersByBusinessId: vi.fn().mockResolvedValue(1),
    })

    await expect(
      service.updateMembershipRole('membership-1', 'business-1', {
        businessId: 'business-1',
        role: 'STAFF',
      })
    ).rejects.toThrowError(BadRequestException)
    await expect(
      service.updateMembershipRole('membership-1', 'business-1', {
        businessId: 'business-1',
        role: 'STAFF',
      })
    ).rejects.toThrowError('Não é possível rebaixar o último OWNER')
    expect(adminRepository.updateMembershipRole).not.toHaveBeenCalled()
  })

  it('não duplica membership para o mesmo user/business', async () => {
    const { adminRepository, service } = createService({
      findUserByEmail: vi.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Usuário',
        email: 'user@example.com',
      }),
      findMembershipByUserAndBusinessId: vi.fn().mockResolvedValue({
        id: 'membership-1',
        role: 'STAFF',
      }),
    })

    await expect(
      service.createMembership('business-1', {
        businessId: 'business-1',
        email: 'user@example.com',
        role: 'STAFF',
      })
    ).rejects.toThrowError(ConflictException)
    await expect(
      service.createMembership('business-1', {
        businessId: 'business-1',
        email: 'user@example.com',
        role: 'STAFF',
      })
    ).rejects.toThrowError('Usuário já é membro deste negócio')
    expect(adminRepository.createMembership).not.toHaveBeenCalled()
  })

  it('bloqueia ação de OWNER quando usuário não tem permissão OWNER', () => {
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
            memberships: [{ businessId: 'business-1', role: 'STAFF' }],
          },
        }),
      }),
    } as any

    expect(() => guard.canActivate(context)).toThrowError(ForbiddenException)
    expect(() => guard.canActivate(context)).toThrowError('Usuário sem permissão para este negócio')
  })
})
