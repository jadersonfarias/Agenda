import { ForbiddenException } from '@nestjs/common'
import { AppointmentStatus } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import { AdminService } from '../../src/admin/admin.service'
import { AppointmentsRepository } from '../../src/appointments/appointments.repository'
import { AppointmentsService } from '../../src/appointments/appointments.service'
import { RoleGuard } from '../../src/auth/role.guard'

function createRoleGuardContext(role: 'OWNER' | 'ADMIN' | 'STAFF') {
  const guard = new RoleGuard({
    getAllAndOverride: vi.fn().mockReturnValue(['OWNER', 'ADMIN', 'STAFF']),
  } as any)
  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        businessId: 'business-b',
        user: {
          id: `${role.toLowerCase()}-a`,
          memberships: [{ businessId: 'business-a', role }],
        },
      }),
    }),
  } as any

  return { guard, context }
}

function createAppointmentsService(
  appointmentsRepository: Record<string, unknown>,
  businessesRepository: Record<string, unknown> = {
    findBusinessById: vi.fn().mockResolvedValue({ id: 'business-a' }),
  },
) {
  return new AppointmentsService(
    appointmentsRepository as any,
    businessesRepository as any,
    { invalidateBusinessAvailability: vi.fn() } as any,
    {} as any,
    { assertBusinessCanWrite: vi.fn().mockResolvedValue(undefined) } as any,
  )
}

describe('Isolamento por businessId e responsável', () => {
  it.each(['OWNER', 'ADMIN', 'STAFF'] as const)(
    '%s do Business A não acessa endpoints admin do Business B',
    (role) => {
      const { guard, context } = createRoleGuardContext(role)

      expect(() => guard.canActivate(context)).toThrowError(ForbiddenException)
      expect(() => guard.canActivate(context)).toThrowError(
        'Usuário sem permissão para este negócio',
      )
    },
  )

  it.each([
    { role: 'OWNER' as const, userId: 'owner-a' },
    { role: 'ADMIN' as const, userId: 'admin-a' },
  ])('$role lista todos os appointments do Business A, inclusive sem responsável', async (access) => {
    const findMany = vi.fn().mockResolvedValue([
      { id: 'appointment-assigned', assignedToUserId: 'staff-a' },
      { id: 'appointment-unassigned', assignedToUserId: null },
    ])
    const service = createAppointmentsService({ findMany })

    await expect(
      service.getAllForAdmin('business-a', 'all', null, access),
    ).resolves.toHaveLength(2)
    expect(findMany).toHaveBeenCalledWith({
      businessId: 'business-a',
      statusFilter: 'all',
      pagination: null,
      assignedToUserId: undefined,
    })
  })

  it('STAFF lista apenas appointments atribuídos a ele no Business A', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { id: 'appointment-a', assignedToUserId: 'staff-a' },
    ])
    const service = createAppointmentsService({ findMany })

    await service.getAllForAdmin(
      'business-a',
      'all',
      null,
      { userId: 'staff-a', role: 'STAFF' },
      'staff-b',
    )

    expect(findMany).toHaveBeenCalledWith({
      businessId: 'business-a',
      statusFilter: 'all',
      pagination: null,
      assignedToUserId: 'staff-a',
    })
  })

  it('STAFF não altera appointment atribuído a outro responsável', async () => {
    const updateStatus = vi.fn()
    const service = createAppointmentsService({
      findById: vi.fn().mockResolvedValue({
        id: 'appointment-a',
        customerId: 'customer-a',
        assignedToUserId: 'staff-b',
      }),
      updateStatus,
    })

    await expect(
      service.updateStatusForAdmin(
        'appointment-a',
        'business-a',
        { status: AppointmentStatus.COMPLETED },
        { userId: 'staff-a', role: 'STAFF' },
      ),
    ).rejects.toThrow('Usuário sem permissão para este agendamento')
    expect(updateStatus).not.toHaveBeenCalled()
  })

  it('OWNER/ADMIN só atribuem responsável que possui membership no mesmo business', async () => {
    const appointmentsService = {
      updateAssignee: vi.fn(),
    }
    const adminRepository = {
      findMembershipByUserAndBusinessId: vi.fn().mockResolvedValue(null),
    }
    const service = new AdminService(
      adminRepository as any,
      {} as any,
      appointmentsService as any,
      {} as any,
      {} as any,
    )

    await expect(
      service.updateAppointmentAssignee('appointment-a', 'business-a', {
        businessId: 'business-a',
        assignedToUserId: 'staff-from-business-b',
      }),
    ).rejects.toThrow('Funcionário inválido para este negócio')

    expect(adminRepository.findMembershipByUserAndBusinessId).toHaveBeenCalledWith(
      'staff-from-business-b',
      'business-a',
    )
    expect(appointmentsService.updateAssignee).not.toHaveBeenCalled()
  })

  it('repository altera e remove appointment somente com id + businessId', async () => {
    const prisma = {
      appointment: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    } as any
    const repository = new AppointmentsRepository(prisma)

    await repository.updateStatus(
      'appointment-a',
      'business-a',
      AppointmentStatus.CANCELED,
    )
    await repository.delete('appointment-a', 'business-a')

    expect(prisma.appointment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'appointment-a', businessId: 'business-a' },
      }),
    )
    expect(prisma.appointment.deleteMany).toHaveBeenCalledWith({
      where: { id: 'appointment-a', businessId: 'business-a' },
    })
  })
})
