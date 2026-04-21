import { Injectable } from '@nestjs/common'

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

@Injectable()
export class AvailabilityCacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>()
  private readonly defaultTtlMs = 60_000

  get<T>(key: string): T | null {
    const entry = this.store.get(key)

    if (!entry) {
      return null
    }

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return null
    }

    return entry.value as T
  }

  set<T>(key: string, value: T, ttlMs = this.defaultTtlMs) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    })
  }

  delete(key: string) {
    this.store.delete(key)
  }

  deleteByPrefix(prefix: string) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
      }
    }
  }
}
