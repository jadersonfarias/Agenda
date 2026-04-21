import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common'
import { AccessTokenService } from './access-token.service'

type AuthenticatedRequest = {
  headers: {
    authorization?: string
  }
  user?: {
    id: string
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
    request.user = { id: payload.sub }

    next()
  }
}
