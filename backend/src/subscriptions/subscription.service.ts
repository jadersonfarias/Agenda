import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { GRACE_PERIOD_DAYS, PLAN_EXPIRED_MESSAGE } from './subscription.constants'
import { SubscriptionRepository } from './subscription.repository'

type BusinessSubscription = Awaited<ReturnType<SubscriptionRepository['findBusinessSubscriptionById']>>

const GRACE_PERIOD_MS = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000

@Injectable()
export class SubscriptionService {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async assertBusinessCanWrite(businessId: string) {
    const business = await this.subscriptionRepository.findBusinessSubscriptionById(businessId)

    if (!business) {
      throw new BadRequestException('Negócio inválido')
    }

    if (this.isWriteBlocked(business, new Date())) {
      throw new HttpException(PLAN_EXPIRED_MESSAGE, HttpStatus.PAYMENT_REQUIRED)
    }
  }

  isWriteBlocked(business: NonNullable<BusinessSubscription>, now: Date) {
    if (business.subscriptionStatus === 'PAST_DUE' || business.subscriptionStatus === 'CANCELED') {
      return true
    }

    const cycleEndsAt =
      business.subscriptionStatus === 'TRIALING'
        ? business.trialEndsAt
        : business.subscriptionStatus === 'ACTIVE'
          ? business.subscriptionEndsAt
          : null

    if (!cycleEndsAt) {
      return false
    }

    return now.getTime() > cycleEndsAt.getTime() + GRACE_PERIOD_MS
  }
}
