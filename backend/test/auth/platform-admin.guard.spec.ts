import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import { PlatformAdminGuard } from '../../src/auth/platform-admin.guard'

function createExecutionContext(request: {
  user?: {
    id: string
    isPlatformAdmin: boolean
  }
}) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any
}

describe('PlatformAdminGuard', () => {
  it('retorna 401 quando o usuário não está autenticado', () => {
    const guard = new PlatformAdminGuard()
    const context = createExecutionContext({})

    expect(() => guard.canActivate(context)).toThrowError(UnauthorizedException)
    expect(() => guard.canActivate(context)).toThrowError('Não autenticado')
  })

  it('retorna 403 quando o usuário autenticado não é platform admin', () => {
    const guard = new PlatformAdminGuard()
    const context = createExecutionContext({
      user: {
        id: 'user-1',
        isPlatformAdmin: false,
      },
    })

    expect(() => guard.canActivate(context)).toThrowError(ForbiddenException)
    expect(() => guard.canActivate(context)).toThrowError(
      'Usuário sem permissão de administrador da plataforma',
    )
  })

  it('permite acesso quando o usuário é platform admin', () => {
    const guard = new PlatformAdminGuard()
    const context = createExecutionContext({
      user: {
        id: 'user-1',
        isPlatformAdmin: true,
      },
    })

    expect(guard.canActivate(context)).toBe(true)
  })
})
