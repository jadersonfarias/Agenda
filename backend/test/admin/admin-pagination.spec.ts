import { describe, expect, it, vi } from 'vitest'
import { AdminController } from '../../src/admin/admin.controller'
import { AdminRepository } from '../../src/admin/admin.repository'

describe('Admin pagination', () => {
  it('lista memberships paginados usando o businessId da requisição', async () => {
    const adminService = {
      listMemberships: vi.fn().mockResolvedValue({ data: [], meta: { page: 2, perPage: 5, total: 0, totalPages: 1 } }),
    } as any
    const controller = new AdminController(adminService)

    await controller.listMemberships({ businessId: 'business-1' } as any, '2', '5')

    expect(adminService.listMemberships).toHaveBeenCalledWith('business-1', {
      page: 2,
      perPage: 5,
    })
  })

  it('lista invitations paginados usando o businessId da requisição', async () => {
    const adminService = {
      listInvitations: vi.fn().mockResolvedValue({ data: [], meta: { page: 3, perPage: 10, total: 0, totalPages: 1 } }),
    } as any
    const controller = new AdminController(adminService)

    await controller.listInvitations({ businessId: 'business-1' } as any, '3', '10')

    expect(adminService.listInvitations).toHaveBeenCalledWith('business-1', {
      page: 3,
      perPage: 10,
    })
  })

  it('pagina memberships no repository respeitando businessId', async () => {
    const prisma = {
      membership: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(12),
      },
    } as any
    const repository = new AdminRepository(prisma)

    await expect(repository.listMembershipsByBusinessId('business-1', {
      page: 2,
      perPage: 5,
    })).resolves.toEqual({
      data: [],
      meta: {
        page: 2,
        perPage: 5,
        total: 12,
        totalPages: 3,
      },
    })

    expect(prisma.membership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: 'business-1' },
        skip: 5,
        take: 5,
      })
    )
    expect(prisma.membership.count).toHaveBeenCalledWith({
      where: { businessId: 'business-1' },
    })
  })

  it('pagina invitations no repository respeitando businessId', async () => {
    const prisma = {
      invitation: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(21),
      },
    } as any
    const repository = new AdminRepository(prisma)

    await expect(repository.listInvitationsByBusinessId('business-1', {
      page: 3,
      perPage: 10,
    })).resolves.toEqual({
      data: [],
      meta: {
        page: 3,
        perPage: 10,
        total: 21,
        totalPages: 3,
      },
    })

    expect(prisma.invitation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          businessId: 'business-1',
          acceptedAt: null,
        },
        skip: 20,
        take: 10,
      })
    )
    expect(prisma.invitation.count).toHaveBeenCalledWith({
      where: {
        businessId: 'business-1',
        acceptedAt: null,
      },
    })
  })
})
