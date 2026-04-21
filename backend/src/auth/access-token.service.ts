import { Injectable, UnauthorizedException } from '@nestjs/common'
import { createHmac, timingSafeEqual } from 'crypto'

type AccessTokenPayload = {
  sub: string
  email?: string | null
  name?: string | null
  exp: number
}

@Injectable()
export class AccessTokenService {
  verifyToken(token: string): AccessTokenPayload {
    const secret = process.env.NEXTAUTH_SECRET

    if (!secret) {
      throw new UnauthorizedException('Segredo de autenticação não configurado')
    }

    const [encodedHeader, encodedPayload, receivedSignature] = token.split('.')

    if (!encodedHeader || !encodedPayload || !receivedSignature) {
      throw new UnauthorizedException('Token inválido')
    }

    const content = `${encodedHeader}.${encodedPayload}`
    const expectedSignature = createHmac('sha256', secret).update(content).digest('base64url')

    const receivedBuffer = Buffer.from(receivedSignature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Token inválido')
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as AccessTokenPayload

    if (!payload.sub || !payload.exp) {
      throw new UnauthorizedException('Token inválido')
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expirado')
    }

    return payload
  }
}
