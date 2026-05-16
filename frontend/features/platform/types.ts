export type PlatformBusinessPlan = 'FREE' | 'BASIC' | 'PRO'
export type PlatformSubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
export type PlatformPaymentMethod = 'PIX' | 'MANUAL' | null
export type PlatformSubscriptionPlan = 'BASIC' | 'PRO'
export type PlatformManualPaymentMethod = 'PIX' | 'MANUAL'
export type PlatformSubscriptionMonths = 1 | 3 | 6 | 12
export type PlatformBusinessSubscriptionStatusAction = 'markPastDue' | 'cancelSubscription'

export type PlatformBusinessItem = {
  id: string
  name: string
  slug: string
  phone: string | null
  plan: PlatformBusinessPlan
  subscriptionStatus: PlatformSubscriptionStatus
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  lastPaymentAt: string | null
  paymentMethod: PlatformPaymentMethod
  createdAt: string
  owner: {
    id: string
    name: string
    email: string
  }
  counts: {
    services: number
    appointments: number
    memberships: number
  }
}

export type PlatformBusinessesResponse = {
  data: PlatformBusinessItem[]
  meta: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

export type UpdatePlatformBusinessSubscriptionInput = {
  businessId: string
  plan: PlatformSubscriptionPlan
  months: PlatformSubscriptionMonths
  paymentMethod: PlatformManualPaymentMethod
}

export type UpdatePlatformBusinessSubscriptionStatusInput = {
  businessId: string
  action: PlatformBusinessSubscriptionStatusAction
}
