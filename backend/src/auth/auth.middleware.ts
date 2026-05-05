import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common'
import { AccessTokenService } from './access-token.service'
import { MembershipRole } from './role.types'

type Membership = {
  businessId: string
  role: MembershipRole
}

type AuthenticatedRequest = {
  headers: {
    authorization?: string
  }
  params?: Record<string, unknown>
  query?: Record<string, unknown>
  body?: Record<string, unknown>
  businessId?: string
  user?: {
    id: string
    memberships: Membership[]
  }
}

type NextFunction = () => void

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly accessTokenService: AccessTokenService) {}

  use(request: AuthenticatedRequest, _: unknown, next: NextFunction): void {
    const authorization = request.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Não autenticado')
    }

    const token = authorization.slice('Bearer '.length).trim()

    if (!token) {
      throw new UnauthorizedException('Não autenticado')
    }

    const payload = this.accessTokenService.verifyToken(token)
    const memberships = payload.memberships ?? []
    const businessId =
      this.asString(request.params?.businessId) ??
      this.asString(request.query?.businessId) ??
      this.asString(request.body?.businessId) ??
      (memberships.length === 1 ? memberships[0].businessId : undefined)

    request.user = { id: payload.sub, memberships }
    request.businessId = businessId

    next()
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined
  }
}
