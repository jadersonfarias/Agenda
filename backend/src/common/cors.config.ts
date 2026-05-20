import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'

type EnvMap = NodeJS.ProcessEnv

export function buildCorsOptions(env: EnvMap = process.env): CorsOptions {
  return {
    origin(origin, callback) {
      if (isCorsOriginAllowed(origin, env)) {
        callback(null, true)
        return
      }

      callback(new Error(`CORS blocked for origin: ${origin ?? 'unknown'}`), false)
    },
  }
}

export function isCorsOriginAllowed(origin: string | undefined, env: EnvMap = process.env) {
  if (!origin) {
    return true
  }

  const normalizedOrigin = normalizeOrigin(origin)
  if (!normalizedOrigin) {
    return false
  }

  if (!isProductionEnvironment(env) && isLocalhostOrigin(normalizedOrigin)) {
    return true
  }

  return getConfiguredAllowedOrigins(env).has(normalizedOrigin)
}

export function getConfiguredAllowedOrigins(env: EnvMap = process.env) {
  return new Set(
    [env.FRONTEND_URL, env.ALLOWED_ORIGINS]
      .flatMap(splitOrigins)
      .map(normalizeOrigin)
      .filter((origin): origin is string => Boolean(origin)),
  )
}

function isProductionEnvironment(env: EnvMap) {
  return env.NODE_ENV === 'production'
}

function splitOrigins(value: string | undefined) {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function normalizeOrigin(origin: string) {
  try {
    return new URL(origin).origin
  } catch {
    return null
  }
}

function isLocalhostOrigin(origin: string) {
  const { hostname } = new URL(origin)

  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1'
}
