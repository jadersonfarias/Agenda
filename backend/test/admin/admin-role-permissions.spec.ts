import 'reflect-metadata'
import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { AdminController } from '../../src/admin/admin.controller'
import { MembershipRole } from '../../src/auth/role.types'
import { RoleGuard } from '../../src/auth/role.guard'
import { ROLES_KEY } from '../../src/auth/roles.decorator'

type Role = MembershipRole

function getEndpointRoles(methodName: keyof AdminController) {
  return Reflect.getMetadata(ROLES_KEY, AdminController.prototype[methodName]) as Role[]
}

function createExecutionContext(requiredRoles: Role[], role: Role, businessId = 'business-1') {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(requiredRoles),
  } as any
  const guard = new RoleGuard(reflector)
  const request = {
    businessId,
    user: {
      id: 'user-1',
      memberships: [{ businessId: 'business-1', role }],
    },
  }
  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any

  return { guard, context, request }
}

function expectAllowed(requiredRoles: Role[], role: Role) {
  const { guard, context } = createExecutionContext(requiredRoles, role)

  expect(guard.canActivate(context)).toBe(true)
}

function expectForbidden(requiredRoles: Role[], role: Role) {
  const { guard, context } = createExecutionContext(requiredRoles, role)

  expect(() => guard.canActivate(context)).toThrowError(ForbiddenException)
  expect(() => guard.canActivate(context)).toThrowError('Usuário sem permissão para este negócio')
}

describe('Admin role permissions', () => {
  it('STAFF não cria, edita ou deleta serviço; OWNER e ADMIN podem', () => {
    for (const methodName of ['createService', 'updateService', 'deleteService'] as const) {
      const roles = getEndpointRoles(methodName)

      expectAllowed(roles, 'OWNER')
      expectAllowed(roles, 'ADMIN')
      expectForbidden(roles, 'STAFF')
    }
  })

  it('STAFF não acessa financeiro; OWNER e ADMIN podem', () => {
    for (const methodName of ['getMonthlySummary', 'getFinancialReport'] as const) {
      const roles = getEndpointRoles(methodName)

      expectAllowed(roles, 'OWNER')
      expectAllowed(roles, 'ADMIN')
      expectForbidden(roles, 'STAFF')
    }
  })

  it('STAFF não altera horário do business; OWNER e ADMIN podem', () => {
    const roles = getEndpointRoles('updateBusinessAvailability')

    expectAllowed(roles, 'OWNER')
    expectAllowed(roles, 'ADMIN')
    expectForbidden(roles, 'STAFF')
  })

  it('STAFF não cria convite', () => {
    const roles = getEndpointRoles('createInvitation')

    expectAllowed(roles, 'OWNER')
    expectForbidden(roles, 'ADMIN')
    expectForbidden(roles, 'STAFF')
  })

  it('STAFF não cria, edita ou remove membership', () => {
    for (const methodName of ['createMembership', 'updateMembershipRole', 'deleteMembership'] as const) {
      const roles = getEndpointRoles(methodName)

      expectAllowed(roles, 'OWNER')
      expectForbidden(roles, 'ADMIN')
      expectForbidden(roles, 'STAFF')
    }
  })

  it('STAFF não lista equipe; OWNER e ADMIN podem', () => {
    const roles = getEndpointRoles('listMemberships')

    expectAllowed(roles, 'OWNER')
    expectAllowed(roles, 'ADMIN')
    expectForbidden(roles, 'STAFF')
  })

  it('STAFF pode acessar agenda e alterar status de appointment', () => {
    for (const methodName of ['listAppointments', 'updateAppointmentStatus'] as const) {
      const roles = getEndpointRoles(methodName)

      expectAllowed(roles, 'OWNER')
      expectAllowed(roles, 'ADMIN')
      expectAllowed(roles, 'STAFF')
    }
  })

  it('OWNER e ADMIN podem atribuir funcionário ao appointment; STAFF não pode', () => {
    const roles = getEndpointRoles('updateAppointmentAssignee')

    expectAllowed(roles, 'OWNER')
    expectAllowed(roles, 'ADMIN')
    expectForbidden(roles, 'STAFF')
  })

  it('OWNER continua com acesso total nas rotas protegidas do admin normal', () => {
    const methodNames = [
      'getDashboard',
      'listServices',
      'createService',
      'updateService',
      'deleteService',
      'updateBusinessAvailability',
      'listMemberships',
      'createMembership',
      'updateMembershipRole',
      'deleteMembership',
      'listInvitations',
      'createInvitation',
      'listAppointments',
      'updateAppointmentStatus',
      'updateAppointmentAssignee',
      'getMonthlySummary',
      'getFinancialReport',
    ] as const

    for (const methodName of methodNames) {
      expectAllowed(getEndpointRoles(methodName), 'OWNER')
    }
  })

  it('valida businessId via Membership e bloqueia role em outro business', () => {
    const roles = getEndpointRoles('createService')
    const { guard, context } = createExecutionContext(roles, 'ADMIN', 'business-2')

    expect(() => guard.canActivate(context)).toThrowError(ForbiddenException)
  })

  it('exige businessId para rotas admin protegidas', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['OWNER']),
    } as any
    const guard = new RoleGuard(reflector)
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'user-1',
            memberships: [{ businessId: 'business-1', role: 'OWNER' }],
          },
        }),
      }),
    } as any

    expect(() => guard.canActivate(context)).toThrowError(BadRequestException)
    expect(() => guard.canActivate(context)).toThrowError('businessId é obrigatório')
  })
})
