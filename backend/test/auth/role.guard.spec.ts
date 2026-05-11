import { ForbiddenException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { RoleGuard } from '../../src/auth/role.guard'

function createExecutionContext(request: {
  businessId?: string
  user?: {
    id: string
    memberships: Array<{ businessId: string; role: 'OWNER' | 'ADMIN' | 'STAFF' }>
  }
}) {
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any
}

describe('RoleGuard', () => {
  it('impede que STAFF execute ação exclusiva de OWNER', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['OWNER']),
    } as any
    const guard = new RoleGuard(reflector)
    const context = createExecutionContext({
      businessId: 'business-1',
      user: {
        id: 'user-1',
        memberships: [{ businessId: 'business-1', role: 'STAFF' }],
      },
    })

    expect(() => guard.canActivate(context)).toThrowError(ForbiddenException)
    expect(() => guard.canActivate(context)).toThrowError('Usuário sem permissão para este negócio')
  })
})
