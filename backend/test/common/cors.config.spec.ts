import { describe, expect, it } from 'vitest'
import { getConfiguredAllowedOrigins, isCorsOriginAllowed } from '../../src/common/cors.config'

describe('cors.config', () => {
  it('permite localhost em desenvolvimento', () => {
    const env = {
      NODE_ENV: 'development',
    } as NodeJS.ProcessEnv

    expect(isCorsOriginAllowed('http://localhost:3000', env)).toBe(true)
    expect(isCorsOriginAllowed('http://127.0.0.1:3001', env)).toBe(true)
  })

  it('permite origins configuradas em produção', () => {
    const env = {
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://app.marcacerta.com',
      ALLOWED_ORIGINS: 'https://admin.marcacerta.com, https://painel.parceiro.com',
    } as NodeJS.ProcessEnv

    expect(isCorsOriginAllowed('https://app.marcacerta.com', env)).toBe(true)
    expect(isCorsOriginAllowed('https://admin.marcacerta.com', env)).toBe(true)
    expect(isCorsOriginAllowed('https://painel.parceiro.com', env)).toBe(true)
  })

  it('bloqueia origins desconhecidas em produção', () => {
    const env = {
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://app.marcacerta.com',
      ALLOWED_ORIGINS: 'https://admin.marcacerta.com',
    } as NodeJS.ProcessEnv

    expect(isCorsOriginAllowed('https://localhost:3000', env)).toBe(false)
    expect(isCorsOriginAllowed('https://evil.example.com', env)).toBe(false)
  })

  it('permite requisição sem header origin', () => {
    const env = {
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://app.marcacerta.com',
    } as NodeJS.ProcessEnv

    expect(isCorsOriginAllowed(undefined, env)).toBe(true)
  })

  it('normaliza e deduplica as origins configuradas', () => {
    const env = {
      FRONTEND_URL: 'https://app.marcacerta.com/login',
      ALLOWED_ORIGINS:
        'https://admin.marcacerta.com, https://admin.marcacerta.com/, https://painel.parceiro.com/path',
    } as NodeJS.ProcessEnv

    expect([...getConfiguredAllowedOrigins(env)]).toEqual([
      'https://app.marcacerta.com',
      'https://admin.marcacerta.com',
      'https://painel.parceiro.com',
    ])
  })
})
