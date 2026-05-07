// import { Injectable, UnauthorizedException } from '@nestjs/common'
// import { createHmac, timingSafeEqual } from 'crypto'
// import { PrismaService } from '../prisma/prisma.service'
// import { MembershipRole } from './role.types'

// type Membership = {
//   businessId: string
//   role: MembershipRole
// }

// type AccessTokenPayload = {
//   sub: string
//   email?: string | null
//   name?: string | null
//   memberships?: Membership[]
//   exp: number
// }

// // Recebe token →
// // Valida assinatura →
// // Verifica integridade →
// // Verifica expiração →
// // Retorna usuário

// @Injectable()
// export class AccessTokenService {
//   constructor(private readonly prisma: PrismaService) {}

//   async generateToken(userId: string, email: string, expiresInDays: number = 7): Promise<string> {
//     const secret = process.env.JWT_SECRET

//     if (!secret) {
//       throw new UnauthorizedException('Segredo de autenticação não configurado')
//     }

//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//       include: {
//         businesses: {
//           select: {
//             id: true,
//           },
//         },
//       },
//     })

//     if (!user) {
//       throw new UnauthorizedException('Usuário não encontrado')
//     }

//     const membershipRows = await this.prisma.$queryRaw<Array<{ businessId: string; role: string }>>`
//       SELECT "businessId", "role"::text AS "role"
//       FROM "Membership"
//       WHERE "userId" = ${userId}
//     `

//     const membershipsFromTable = membershipRows.filter(
//       (membership: { businessId: string; role: string }): membership is Membership =>
//         membership.role === 'OWNER' || membership.role === 'ADMIN' || membership.role === 'STAFF',
//     )

//     const memberships =
//       membershipsFromTable.length > 0
//         ? membershipsFromTable
//         : user.businesses.map((business: { id: string }) => ({
//             businessId: business.id,
//             role: 'OWNER' as const,
//           }))

//     const now = Math.floor(Date.now() / 1000)
//     const exp = now + expiresInDays * 24 * 60 * 60

//     const payload: AccessTokenPayload = {
//       sub: userId,
//       email,
//       memberships,
//       exp,
//     }

//     const header = { alg: 'HS256', typ: 'JWT' }
//     const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
//     const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')

//     const content = `${encodedHeader}.${encodedPayload}`
//     const signature = createHmac('sha256', secret).update(content).digest('base64url')

//     return `${content}.${signature}`
//   }

//   verifyToken(token: string): AccessTokenPayload {
//     const secret = process.env.JWT_SECRET

//     if (!secret) {
//       throw new UnauthorizedException('Segredo de autenticação não configurado')
//     }

//     const [encodedHeader, encodedPayload, receivedSignature] = token.split('.')

//     if (!encodedHeader || !encodedPayload || !receivedSignature) {
//       throw new UnauthorizedException('Token inválido')
//     }

//     const content = `${encodedHeader}.${encodedPayload}`
//     const expectedSignature = createHmac('sha256', secret).update(content).digest('base64url')

//     const receivedBuffer = Buffer.from(receivedSignature)
//     const expectedBuffer = Buffer.from(expectedSignature)

//     if (
//       receivedBuffer.length !== expectedBuffer.length ||
//       !timingSafeEqual(receivedBuffer, expectedBuffer)
//     ) {
//       throw new UnauthorizedException('Token inválido')
//     }

//     const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as AccessTokenPayload

//     if (!payload.sub || !payload.exp) {
//       throw new UnauthorizedException('Token inválido')
//     }

//     if (payload.exp <= Math.floor(Date.now() / 1000)) {
//       throw new UnauthorizedException('Token expirado')
//     }

//     return payload
//   }
// }
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { MembershipRole } from './role.types'

type Membership = {
  businessId: string
  role: MembershipRole
}

type BusinessContext = {
  id: string
  name: string
  slug: string
  role: MembershipRole
}

type AccessTokenPayload = {
  sub: string
  email?: string | null
  name?: string | null
  memberships?: Membership[]
  businesses?: BusinessContext[]
  currentBusinessId?: string | null
}

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async generateToken(userId: string, email: string, expiresInDays: number = 7): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado')
    }

    const membershipRows = await this.prisma.membership.findMany({
      where: { userId },
      select: {
        businessId: true,
        role: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'asc' },
        { business: { createdAt: 'asc' } },
      ],
    })

    const memberships: Membership[] = membershipRows.map((membership: {
      businessId: string
      role: MembershipRole
    }) => ({
      businessId: membership.businessId,
      role: membership.role,
    }))

    const businesses: BusinessContext[] = membershipRows.map((membership: {
      role: MembershipRole
      business: {
        id: string
        name: string
        slug: string
      }
    }) => ({
      id: membership.business.id,
      name: membership.business.name,
      slug: membership.business.slug,
      role: membership.role,
    }))

    const payload: AccessTokenPayload = {
      sub: userId,
      email,
      memberships,
      businesses,
      currentBusinessId: businesses[0]?.id ?? null,
    }

    return this.jwtService.sign(payload, {
      expiresIn: `${expiresInDays}d`,
    })
  }

  verifyToken(token: string): AccessTokenPayload {
    try {
      return this.jwtService.verify<AccessTokenPayload>(token)
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado')
    }
  }
}
