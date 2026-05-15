import { HttpException, HttpStatus } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { SimpleRateLimitGuard } from '../../src/common/simple-rate-limit.guard'
import { SimpleRateLimitService } from '../../src/common/simple-rate-limit.service'

describe('SimpleRateLimitGuard', () => {
  it('permite a requisição quando não há política configurada', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(undefined),
    } as any

    const guard = new SimpleRateLimitGuard(reflector, new SimpleRateLimitService())

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ ip: '127.0.0.1' }),
        getResponse: () => ({ setHeader: vi.fn() }),
      }),
    } as any

    expect(guard.canActivate(context)).toBe(true)
  })

  it('retorna 429 quando o limite é excedido', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue({
        key: 'auth-login',
        limit: 1,
        windowMs: 60_000,
        message: 'Muitas tentativas de login. Tente novamente em instantes.',
      }),
    } as any

    const response = {
      setHeader: vi.fn(),
    }

    const guard = new SimpleRateLimitGuard(reflector, new SimpleRateLimitService())
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ ip: '127.0.0.1' }),
        getResponse: () => response,
      }),
    } as any

    expect(guard.canActivate(context)).toBe(true)
    try {
      guard.canActivate(context)
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException)
      expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS)
    }
    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number))
  })
})
