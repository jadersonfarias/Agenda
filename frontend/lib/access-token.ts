export type MembershipRole = 'OWNER' | 'ADMIN' | 'STAFF'

export type AccessTokenMembership = {
  businessId: string
  role: MembershipRole
}

export type AccessTokenBusinessContext = {
  id: string
  name: string
  slug: string
  role: MembershipRole
}

type AccessTokenPayload = {
  sub: string
  email?: string | null
  name?: string | null
  isPlatformAdmin?: boolean
  memberships?: AccessTokenMembership[]
  businesses?: AccessTokenBusinessContext[]
  currentBusinessId?: string | null
  exp?: number
}

function decodeBase64Url(value: string) {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddedValue = normalizedValue.padEnd(normalizedValue.length + ((4 - (normalizedValue.length % 4)) % 4), '=')

  if (typeof atob === 'function') {
    return atob(paddedValue)
  }

  return Buffer.from(value, 'base64url').toString()
}

export function decodeAccessToken(token: string): AccessTokenPayload {
  const [, encodedPayload] = token.split('.')

  if (!encodedPayload) {
    throw new Error('Token inválido')
  }

  return JSON.parse(decodeBase64Url(encodedPayload)) as AccessTokenPayload
}

export function getPrimaryBusinessId(token: string) {
  const payload = decodeAccessToken(token)

  return payload.currentBusinessId ?? payload.businesses?.[0]?.id ?? payload.memberships?.[0]?.businessId
}

export function getTokenBusinesses(token: string) {
  return decodeAccessToken(token).businesses ?? []
}
