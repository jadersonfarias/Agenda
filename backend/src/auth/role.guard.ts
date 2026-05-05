import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from './roles.decorator'
import { MembershipRole } from './role.types'

type RequestMembership = {
  businessId: string
  role: MembershipRole
}

type AuthenticatedRequest = {
  params?: Record<string, unknown>
  query?: Record<string, unknown>
  body?: Record<string, unknown>
  businessId?: string
  user?: {
    id: string
    memberships: RequestMembership[]
  }
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<MembershipRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const businessId = request.businessId ?? this.extractBusinessId(request)

    if (!request.user) {
      throw new ForbiddenException('Usuário não autenticado')
    }

    if (!businessId) {
      throw new BadRequestException('businessId é obrigatório')
    }

    const membership = request.user.memberships.find(
      (item) => item.businessId === businessId && requiredRoles.includes(item.role),
    )

    if (!membership) {
      throw new ForbiddenException('Usuário sem permissão para este negócio')
    }

    request.businessId = businessId

    return true
  }

  private extractBusinessId(request: AuthenticatedRequest): string | undefined {
    const paramsBusinessId = this.asString(request.params?.businessId)
    const queryBusinessId = this.asString(request.query?.businessId)
    const bodyBusinessId = this.asString(request.body?.businessId)

    return paramsBusinessId ?? queryBusinessId ?? bodyBusinessId
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined
  }
}
