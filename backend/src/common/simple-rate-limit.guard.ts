import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator'
import { SimpleRateLimitService } from './simple-rate-limit.service'

type RateLimitRequest = {
  ip?: string
  headers?: Record<string, string | string[] | undefined>
  socket?: {
    remoteAddress?: string
  }
}

type RateLimitResponse = {
  setHeader?: (name: string, value: string | number) => void
}

@Injectable()
export class SimpleRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly simpleRateLimitService: SimpleRateLimitService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!policy) {
      return true
    }

    const request = context.switchToHttp().getRequest<RateLimitRequest>()
    const response = context.switchToHttp().getResponse<RateLimitResponse>()
    const clientIp = this.extractClientIp(request)
    const bucketKey = `${policy.key}:${clientIp}`
    const result = this.simpleRateLimitService.consume(bucketKey, policy.limit, policy.windowMs)

    response.setHeader?.('X-RateLimit-Limit', policy.limit)
    response.setHeader?.('X-RateLimit-Remaining', result.remaining)
    response.setHeader?.('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000))

    if (!result.allowed) {
      response.setHeader?.('Retry-After', Math.max(1, Math.ceil(result.retryAfterMs / 1000)))
      throw new HttpException(
        policy.message ?? 'Muitas tentativas. Tente novamente em instantes.',
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    return true
  }

  private extractClientIp(request: RateLimitRequest): string {
    const forwardedFor = request.headers?.['x-forwarded-for']

    if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
      return forwardedFor.split(',')[0]?.trim() || 'unknown'
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0]?.trim() || 'unknown'
    }

    if (request.ip && request.ip.trim().length > 0) {
      return request.ip
    }

    if (request.socket?.remoteAddress?.trim()) {
      return request.socket.remoteAddress.trim()
    }

    return 'unknown'
  }
}
