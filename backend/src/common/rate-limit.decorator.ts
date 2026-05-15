import { SetMetadata } from '@nestjs/common'

export type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
  message?: string
}

export const RATE_LIMIT_KEY = 'rate-limit'

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options)
