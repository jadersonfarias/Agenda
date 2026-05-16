import { type PlatformBusinessPlan, type PlatformSubscriptionStatus } from './types'

export const platformSubscriptionStatusLabels: Record<PlatformSubscriptionStatus, string> = {
  TRIALING: 'Teste grátis',
  ACTIVE: 'Ativo',
  PAST_DUE: 'Vencido',
  CANCELED: 'Cancelado',
}

export const platformSubscriptionStatusBadgeStyles: Record<PlatformSubscriptionStatus, string> = {
  TRIALING: 'bg-purple-100 text-purple-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PAST_DUE: 'bg-amber-100 text-amber-700',
  CANCELED: 'bg-slate-200 text-slate-700',
}

export const platformPlanBadgeStyles: Record<PlatformBusinessPlan, string> = {
  FREE: 'bg-slate-100 text-slate-700',
  BASIC: 'bg-sky-100 text-sky-700',
  PRO: 'bg-purple-100 text-purple-700',
}
