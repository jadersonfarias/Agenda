import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

type AuthenticatedRequest = {
  user?: {
    id: string
    isPlatformAdmin: boolean
  }
}

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!request.user) {
      throw new UnauthorizedException('Não autenticado')
    }

    if (!request.user.isPlatformAdmin) {
      throw new ForbiddenException('Usuário sem permissão de administrador da plataforma')
    }

    return true
  }
}
