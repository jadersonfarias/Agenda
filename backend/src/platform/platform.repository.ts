import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PaginationParams, PaginatedResult, buildPaginationMeta } from '../common/pagination'
import { PlatformBusinessesQueryDto } from './platform.schema'

export type PlatformBusinessSummaryRecord = {
  id: string
  name: string
  slug: string
  phone: string | null
  plan: 'FREE' | 'BASIC' | 'PRO'
  subscriptionStatus: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
  trialEndsAt: Date | null
  subscriptionEndsAt: Date | null
  lastPaymentAt: Date | null
  paymentMethod: 'PIX' | 'MANUAL' | null
  createdAt: Date
  owner: {
    id: string
    name: string
    email: string
  }
  _count: {
    services: number
    appointments: number
    memberships: number
  }
}

const businessSummarySelect = {
  id: true,
  name: true,
  slug: true,
  phone: true,
  plan: true,
  subscriptionStatus: true,
  trialEndsAt: true,
  subscriptionEndsAt: true,
  lastPaymentAt: true,
  paymentMethod: true,
  createdAt: true,
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  _count: {
    select: {
      services: true,
      appointments: true,
      memberships: true,
    },
  },
} as const

@Injectable()
export class PlatformRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listBusinesses(
    filters: PlatformBusinessesQueryDto,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<PlatformBusinessSummaryRecord>> {
    const where = this.buildBusinessesWhere(filters)

    const [data, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        select: businessSummarySelect,
        orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
        skip: (pagination.page - 1) * pagination.perPage,
        take: pagination.perPage,
      }),
      this.prisma.business.count({ where }),
    ])

    return {
      data,
      meta: buildPaginationMeta(total, pagination),
    }
  }

  async findBusinessSubscriptionById(businessId: string) {
    return this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        subscriptionEndsAt: true,
      },
    })
  }

  async updateBusinessSubscription(input: {
    businessId: string
    plan: 'BASIC' | 'PRO'
    subscriptionEndsAt: Date
    lastPaymentAt: Date
    paymentMethod: 'PIX' | 'MANUAL'
  }): Promise<PlatformBusinessSummaryRecord | null> {
    await this.prisma.business.updateMany({
      where: { id: input.businessId },
      data: {
        plan: input.plan,
        subscriptionStatus: 'ACTIVE',
        lastPaymentAt: input.lastPaymentAt,
        paymentMethod: input.paymentMethod,
        subscriptionEndsAt: input.subscriptionEndsAt,
      },
    })

    return this.prisma.business.findUnique({
      where: { id: input.businessId },
      select: businessSummarySelect,
    })
  }

  async updateBusinessSubscriptionStatus(input: {
    businessId: string
    subscriptionStatus: 'CANCELED' | 'PAST_DUE'
  }): Promise<PlatformBusinessSummaryRecord | null> {
    await this.prisma.business.updateMany({
      where: { id: input.businessId },
      data: {
        subscriptionStatus: input.subscriptionStatus,
      },
    })

    return this.prisma.business.findUnique({
      where: { id: input.businessId },
      select: businessSummarySelect,
    })
  }

  private buildBusinessesWhere(filters: PlatformBusinessesQueryDto) {
    return {
      ...(filters.status ? { subscriptionStatus: filters.status } : {}),
      ...(filters.plan ? { plan: filters.plan } : {}),
      ...(filters.search
        ? {
            OR: [
              {
                name: {
                  contains: filters.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                slug: {
                  contains: filters.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                owner: {
                  is: {
                    email: {
                      contains: filters.search,
                      mode: 'insensitive' as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    }
  }
}
