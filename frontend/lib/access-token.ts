import { createHmac } from 'crypto'

type AccessTokenPayload = {
  sub: string
  email?: string | null
  name?: string | null
  exp: number
}

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString('base64url')
}

function signSegment(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

export function createAccessToken(input: {
  userId: string
  email?: string | null
  name?: string | null
  secret: string
}) {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const payload: AccessTokenPayload = {
    sub: input.userId,
    email: input.email,
    name: input.name,
    exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS,
  }

  const encodedHeader = encodeBase64Url(JSON.stringify(header))
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const content = `${encodedHeader}.${encodedPayload}`
  const signature = signSegment(content, input.secret)

  return `${content}.${signature}`
}
