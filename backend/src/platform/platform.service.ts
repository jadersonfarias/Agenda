import { Injectable, NotFoundException } from '@nestjs/common'
import { DateTime } from 'luxon'
import { PaginationParams } from '../common/pagination'
import { PlatformBusinessSummaryRecord, PlatformRepository } from './platform.repository'
import { PlatformBusinessesQueryDto, PlatformUpdateBusinessSubscriptionDto } from './platform.schema'

@Injectable()
export class PlatformService {
  constructor(private readonly platformRepository: PlatformRepository) {}

  async listBusinesses(filters: PlatformBusinessesQueryDto, pagination: PaginationParams) {
    const result = await this.platformRepository.listBusinesses(filters, pagination)

    return {
      data: result.data.map((business: PlatformBusinessSummaryRecord) => this.mapBusinessSummary(business)),
      meta: result.meta,
    }
  }

  async updateBusinessSubscription(businessId: string, dto: PlatformUpdateBusinessSubscriptionDto) {
    const business = await this.platformRepository.findBusinessSubscriptionById(businessId)

    if (!business) {
      throw new NotFoundException('Negócio não encontrado')
    }

    const now = DateTime.utc()
    const currentSubscriptionEndsAt = business.subscriptionEndsAt
      ? DateTime.fromJSDate(business.subscriptionEndsAt, { zone: 'utc' })
      : null

    const baseSubscriptionDate =
      currentSubscriptionEndsAt && currentSubscriptionEndsAt.toMillis() > now.toMillis()
        ? currentSubscriptionEndsAt
        : now

    const subscriptionEndsAt = baseSubscriptionDate.plus({ months: dto.months }).toJSDate()
    const lastPaymentAt = now.toJSDate()

    const updatedBusiness = await this.platformRepository.updateBusinessSubscription({
      businessId,
      plan: dto.plan,
      subscriptionEndsAt,
      lastPaymentAt,
      paymentMethod: dto.paymentMethod,
    })

    if (!updatedBusiness) {
      throw new NotFoundException('Negócio não encontrado')
    }

    return this.mapBusinessSummary(updatedBusiness)
  }

  async cancelBusinessSubscription(businessId: string) {
    return this.updateBusinessSubscriptionStatus(businessId, 'CANCELED')
  }

  async markBusinessSubscriptionAsPastDue(businessId: string) {
    return this.updateBusinessSubscriptionStatus(businessId, 'PAST_DUE')
  }

  private mapBusinessSummary(business: PlatformBusinessSummaryRecord) {
    return {
      id: business.id,
      name: business.name,
      slug: business.slug,
      phone: business.phone,
      plan: business.plan,
      subscriptionStatus: business.subscriptionStatus,
      trialEndsAt: business.trialEndsAt?.toISOString() ?? null,
      subscriptionEndsAt: business.subscriptionEndsAt?.toISOString() ?? null,
      lastPaymentAt: business.lastPaymentAt?.toISOString() ?? null,
      paymentMethod: business.paymentMethod ?? null,
      createdAt: business.createdAt.toISOString(),
      owner: business.owner,
      counts: {
        services: business._count.services,
        appointments: business._count.appointments,
        memberships: business._count.memberships,
      },
    }
  }

  private async updateBusinessSubscriptionStatus(
    businessId: string,
    subscriptionStatus: 'CANCELED' | 'PAST_DUE',
  ) {
    const updatedBusiness = await this.platformRepository.updateBusinessSubscriptionStatus({
      businessId,
      subscriptionStatus,
    })

    if (!updatedBusiness) {
      throw new NotFoundException('Negócio não encontrado')
    }

    return this.mapBusinessSummary(updatedBusiness)
  }
}
