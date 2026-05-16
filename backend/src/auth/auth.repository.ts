import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        isPlatformAdmin: true,
      },
    })
  }

  async findBusinessBySlug(slug: string) {
    return this.prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })
  }

  async createBusinessOwner(input: {
    ownerName: string
    email: string
    hashedPassword: string
    businessName: string
    businessSlug: string
    phone: string | null
    plan: 'FREE' | 'BASIC' | 'PRO'
    subscriptionStatus: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
    trialEndsAt: Date
  }) {
    const userId = randomUUID()
    const businessId = randomUUID()
    const membershipId = randomUUID()

    await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          id: userId,
          name: input.ownerName,
          email: input.email,
          password: input.hashedPassword,
        },
      }),
      this.prisma.business.create({
        data: {
          id: businessId,
          name: input.businessName,
          slug: input.businessSlug,
          phone: input.phone,
          plan: input.plan,
          subscriptionStatus: input.subscriptionStatus,
          trialEndsAt: input.trialEndsAt,
          ownerId: userId,
        },
      }),
      this.prisma.membership.create({
        data: {
          id: membershipId,
          userId,
          businessId,
          role: 'OWNER',
        },
      }),
    ])

    return {
      user: {
        id: userId,
        name: input.ownerName,
        email: input.email,
        isPlatformAdmin: false,
      },
      business: {
        id: businessId,
        name: input.businessName,
        slug: input.businessSlug,
        phone: input.phone,
        plan: input.plan,
        subscriptionStatus: input.subscriptionStatus,
        trialEndsAt: input.trialEndsAt.toISOString(),
        subscriptionEndsAt: null,
        lastPaymentAt: null,
        paymentMethod: null,
      },
      membership: {
        id: membershipId,
        role: 'OWNER' as const,
      },
    }
  }

  async listBusinessesByUserId(userId: string) {
    return this.prisma.membership.findMany({
      where: { userId },
      select: {
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
  }
}
