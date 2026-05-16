import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlatformService } from '../../src/platform/platform.service'

function createBusinessSummaryRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'business-1',
    name: 'Salao Central',
    slug: 'salao-central',
    phone: '(11) 99999-9999',
    plan: 'PRO',
    subscriptionStatus: 'ACTIVE',
    trialEndsAt: new Date('2026-05-20T12:00:00.000Z'),
    subscriptionEndsAt: new Date('2026-06-20T12:00:00.000Z'),
    lastPaymentAt: new Date('2026-05-15T12:00:00.000Z'),
    paymentMethod: 'MANUAL',
    createdAt: new Date('2026-05-01T10:00:00.000Z'),
    owner: {
      id: 'user-1',
      name: 'Maria',
      email: 'maria@example.com',
    },
    _count: {
      services: 7,
      appointments: 42,
      memberships: 3,
    },
    ...overrides,
  }
}

describe('PlatformService', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('lista negócios do painel master com owner, counts e paginação', async () => {
    const platformRepository = {
      listBusinesses: vi.fn().mockResolvedValue({
        data: [createBusinessSummaryRecord()],
        meta: {
          page: 2,
          perPage: 10,
          total: 25,
          totalPages: 3,
        },
      }),
    } as any

    const service = new PlatformService(platformRepository)

    await expect(
      service.listBusinesses(
        {
          status: 'ACTIVE',
          plan: 'PRO',
          search: 'maria@example.com',
        },
        {
          page: 2,
          perPage: 10,
        },
      ),
    ).resolves.toEqual({
      data: [
        {
          id: 'business-1',
          name: 'Salao Central',
          slug: 'salao-central',
          phone: '(11) 99999-9999',
          plan: 'PRO',
          subscriptionStatus: 'ACTIVE',
          trialEndsAt: '2026-05-20T12:00:00.000Z',
          subscriptionEndsAt: '2026-06-20T12:00:00.000Z',
          lastPaymentAt: '2026-05-15T12:00:00.000Z',
          paymentMethod: 'MANUAL',
          createdAt: '2026-05-01T10:00:00.000Z',
          owner: {
            id: 'user-1',
            name: 'Maria',
            email: 'maria@example.com',
          },
          counts: {
            services: 7,
            appointments: 42,
            memberships: 3,
          },
        },
      ],
      meta: {
        page: 2,
        perPage: 10,
        total: 25,
        totalPages: 3,
      },
    })

    expect(platformRepository.listBusinesses).toHaveBeenCalledWith(
      {
        status: 'ACTIVE',
        plan: 'PRO',
        search: 'maria@example.com',
      },
      {
        page: 2,
        perPage: 10,
      },
    )
  })

  it('ativa plano BASIC por 1 mês', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00.000Z'))

    const platformRepository = {
      findBusinessSubscriptionById: vi.fn().mockResolvedValue({
        id: 'business-1',
        subscriptionEndsAt: null,
      }),
      updateBusinessSubscription: vi.fn().mockImplementation(async (input) =>
        createBusinessSummaryRecord({
          plan: input.plan,
          subscriptionStatus: 'ACTIVE',
          subscriptionEndsAt: input.subscriptionEndsAt,
          lastPaymentAt: input.lastPaymentAt,
          paymentMethod: input.paymentMethod,
        }),
      ),
    } as any

    const service = new PlatformService(platformRepository)

    await expect(
      service.updateBusinessSubscription('business-1', {
        plan: 'BASIC',
        months: 1,
        paymentMethod: 'PIX',
      }),
    ).resolves.toMatchObject({
      id: 'business-1',
      plan: 'BASIC',
      subscriptionStatus: 'ACTIVE',
      paymentMethod: 'PIX',
      lastPaymentAt: '2026-05-15T12:00:00.000Z',
      subscriptionEndsAt: '2026-06-15T12:00:00.000Z',
    })

    expect(platformRepository.updateBusinessSubscription).toHaveBeenCalledWith({
      businessId: 'business-1',
      plan: 'BASIC',
      subscriptionEndsAt: new Date('2026-06-15T12:00:00.000Z'),
      lastPaymentAt: new Date('2026-05-15T12:00:00.000Z'),
      paymentMethod: 'PIX',
    })
  })

  it('ativa plano PRO por 1 mês', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00.000Z'))

    const platformRepository = {
      findBusinessSubscriptionById: vi.fn().mockResolvedValue({
        id: 'business-1',
        subscriptionEndsAt: null,
      }),
      updateBusinessSubscription: vi.fn().mockImplementation(async (input) =>
        createBusinessSummaryRecord({
          plan: input.plan,
          subscriptionStatus: 'ACTIVE',
          subscriptionEndsAt: input.subscriptionEndsAt,
          lastPaymentAt: input.lastPaymentAt,
          paymentMethod: input.paymentMethod,
        }),
      ),
    } as any

    const service = new PlatformService(platformRepository)

    await expect(
      service.updateBusinessSubscription('business-1', {
        plan: 'PRO',
        months: 1,
        paymentMethod: 'MANUAL',
      }),
    ).resolves.toMatchObject({
      id: 'business-1',
      plan: 'PRO',
      subscriptionStatus: 'ACTIVE',
      paymentMethod: 'MANUAL',
      lastPaymentAt: '2026-05-15T12:00:00.000Z',
      subscriptionEndsAt: '2026-06-15T12:00:00.000Z',
    })

    expect(platformRepository.updateBusinessSubscription).toHaveBeenCalledWith({
      businessId: 'business-1',
      plan: 'PRO',
      subscriptionEndsAt: new Date('2026-06-15T12:00:00.000Z'),
      lastPaymentAt: new Date('2026-05-15T12:00:00.000Z'),
      paymentMethod: 'MANUAL',
    })
  })

  it('renova a partir da subscriptionEndsAt futura quando ela já existe', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00.000Z'))

    const platformRepository = {
      findBusinessSubscriptionById: vi.fn().mockResolvedValue({
        id: 'business-1',
        subscriptionEndsAt: new Date('2026-06-20T12:00:00.000Z'),
      }),
      updateBusinessSubscription: vi.fn().mockImplementation(async (input) =>
        createBusinessSummaryRecord({
          plan: input.plan,
          subscriptionStatus: 'ACTIVE',
          subscriptionEndsAt: input.subscriptionEndsAt,
          lastPaymentAt: input.lastPaymentAt,
          paymentMethod: input.paymentMethod,
        }),
      ),
    } as any

    const service = new PlatformService(platformRepository)

    await expect(
      service.updateBusinessSubscription('business-1', {
        plan: 'PRO',
        months: 1,
        paymentMethod: 'PIX',
      }),
    ).resolves.toMatchObject({
      id: 'business-1',
      plan: 'PRO',
      paymentMethod: 'PIX',
      lastPaymentAt: '2026-05-15T12:00:00.000Z',
      subscriptionEndsAt: '2026-07-20T12:00:00.000Z',
    })

    expect(platformRepository.updateBusinessSubscription).toHaveBeenCalledWith({
      businessId: 'business-1',
      plan: 'PRO',
      subscriptionEndsAt: new Date('2026-07-20T12:00:00.000Z'),
      lastPaymentAt: new Date('2026-05-15T12:00:00.000Z'),
      paymentMethod: 'PIX',
    })
  })

  it('cancela assinatura', async () => {
    const platformRepository = {
      updateBusinessSubscriptionStatus: vi.fn().mockResolvedValue(
        createBusinessSummaryRecord({
          subscriptionStatus: 'CANCELED',
        }),
      ),
    } as any

    const service = new PlatformService(platformRepository)

    await expect(service.cancelBusinessSubscription('business-1')).resolves.toMatchObject({
      id: 'business-1',
      subscriptionStatus: 'CANCELED',
    })

    expect(platformRepository.updateBusinessSubscriptionStatus).toHaveBeenCalledWith({
      businessId: 'business-1',
      subscriptionStatus: 'CANCELED',
    })
  })

  it('marca assinatura como PAST_DUE', async () => {
    const platformRepository = {
      updateBusinessSubscriptionStatus: vi.fn().mockResolvedValue(
        createBusinessSummaryRecord({
          subscriptionStatus: 'PAST_DUE',
        }),
      ),
    } as any

    const service = new PlatformService(platformRepository)

    await expect(service.markBusinessSubscriptionAsPastDue('business-1')).resolves.toMatchObject({
      id: 'business-1',
      subscriptionStatus: 'PAST_DUE',
    })

    expect(platformRepository.updateBusinessSubscriptionStatus).toHaveBeenCalledWith({
      businessId: 'business-1',
      subscriptionStatus: 'PAST_DUE',
    })
  })
})
