import { HttpException } from '@nestjs/common'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PLAN_EXPIRED_MESSAGE } from '../../src/subscriptions/subscription.constants'
import { SubscriptionService } from '../../src/subscriptions/subscription.service'

function createBusinessSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'business-1',
    subscriptionStatus: 'TRIALING',
    trialEndsAt: new Date('2026-05-20T12:00:00.000Z'),
    subscriptionEndsAt: null,
    ...overrides,
  } as any
}

function createServiceForBusiness(business: unknown) {
  const subscriptionRepository = {
    findBusinessSubscriptionById: vi.fn().mockResolvedValue(business),
  } as any

  return {
    service: new SubscriptionService(subscriptionRepository),
    subscriptionRepository,
  }
}

async function expectPlanExpired(promise: Promise<unknown>) {
  await expect(promise).rejects.toThrow(PLAN_EXPIRED_MESSAGE)

  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException)
    expect((error as HttpException).getStatus()).toBe(402)
  }
}

describe('SubscriptionService', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('permite escrita para TRIALING dentro do prazo', async () => {
    const service = new SubscriptionService({} as any)

    expect(service.isWriteBlocked(
      createBusinessSubscription({
        subscriptionStatus: 'TRIALING',
        trialEndsAt: new Date('2026-05-20T12:00:00.000Z'),
      }),
      new Date('2026-05-20T11:59:00.000Z'),
    )).toBe(false)
  })

  it('permite escrita para TRIALING dentro de 1 dia de tolerância', () => {
    const service = new SubscriptionService({} as any)

    expect(service.isWriteBlocked(
      createBusinessSubscription({
        subscriptionStatus: 'TRIALING',
        trialEndsAt: new Date('2026-05-20T12:00:00.000Z'),
      }),
      new Date('2026-05-21T11:59:59.000Z'),
    )).toBe(false)
  })

  it('bloqueia escrita para TRIALING após a tolerância', async () => {
    const { service } = createServiceForBusiness(
      createBusinessSubscription({
        subscriptionStatus: 'TRIALING',
        trialEndsAt: new Date('2026-05-20T12:00:00.000Z'),
      }),
    )

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-21T12:00:00.001Z'))

    await expectPlanExpired(service.assertBusinessCanWrite('business-1'))
  })

  it('permite escrita para ACTIVE dentro do prazo', () => {
    const service = new SubscriptionService({} as any)

    expect(service.isWriteBlocked(
      createBusinessSubscription({
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: new Date('2026-05-20T12:00:00.000Z'),
      }),
      new Date('2026-05-20T11:59:00.000Z'),
    )).toBe(false)
  })

  it('permite escrita para ACTIVE dentro de 1 dia de tolerância', () => {
    const service = new SubscriptionService({} as any)

    expect(service.isWriteBlocked(
      createBusinessSubscription({
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: new Date('2026-05-20T12:00:00.000Z'),
      }),
      new Date('2026-05-21T11:59:59.000Z'),
    )).toBe(false)
  })

  it('bloqueia escrita para ACTIVE após a tolerância', async () => {
    const { service } = createServiceForBusiness(
      createBusinessSubscription({
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: new Date('2026-05-20T12:00:00.000Z'),
      }),
    )

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-21T12:00:00.001Z'))

    await expectPlanExpired(service.assertBusinessCanWrite('business-1'))
  })

  it('bloqueia escrita para PAST_DUE', async () => {
    const { service } = createServiceForBusiness(
      createBusinessSubscription({
        subscriptionStatus: 'PAST_DUE',
      }),
    )

    await expectPlanExpired(service.assertBusinessCanWrite('business-1'))
  })

  it('bloqueia escrita para CANCELED', async () => {
    const { service } = createServiceForBusiness(
      createBusinessSubscription({
        subscriptionStatus: 'CANCELED',
      }),
    )

    await expectPlanExpired(service.assertBusinessCanWrite('business-1'))
  })
})
