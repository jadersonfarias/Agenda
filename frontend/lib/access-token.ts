export type MembershipRole = 'OWNER' | 'ADMIN' | 'STAFF'

export type AccessTokenMembership = {
  businessId: string
  role: MembershipRole
}

type AccessTokenPayload = {
  sub: string
  email?: string | null
  name?: string | null
  memberships?: AccessTokenMembership[]
  exp?: number
}

export function decodeAccessToken(token: string): AccessTokenPayload {
  const [, encodedPayload] = token.split('.')

  if (!encodedPayload) {
    throw new Error('Token inválido')
  }

  return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as AccessTokenPayload
}

export function getPrimaryBusinessId(token: string) {
  return decodeAccessToken(token).memberships?.[0]?.businessId
}
