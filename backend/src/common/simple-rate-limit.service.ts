import { Injectable } from '@nestjs/common'

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitConsumeResult = {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterMs: number
}

@Injectable()
export class SimpleRateLimitService {
  private readonly store = new Map<string, RateLimitEntry>()

  consume(key: string, limit: number, windowMs: number): RateLimitConsumeResult {
    const now = Date.now()
    const existingEntry = this.store.get(key)

    if (!existingEntry || existingEntry.resetAt <= now) {
      const resetAt = now + windowMs
      this.store.set(key, {
        count: 1,
        resetAt,
      })

      return {
        allowed: true,
        remaining: Math.max(0, limit - 1),
        resetAt,
        retryAfterMs: windowMs,
      }
    }

    if (existingEntry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: existingEntry.resetAt,
        retryAfterMs: Math.max(0, existingEntry.resetAt - now),
      }
    }

    existingEntry.count += 1
    this.store.set(key, existingEntry)

    return {
      allowed: true,
      remaining: Math.max(0, limit - existingEntry.count),
      resetAt: existingEntry.resetAt,
      retryAfterMs: Math.max(0, existingEntry.resetAt - now),
    }
  }
}
