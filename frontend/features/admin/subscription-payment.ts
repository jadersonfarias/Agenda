import { type AdminDashboardData } from './types'

type AdminBusiness = AdminDashboardData['business']
type PaidPlan = Extract<AdminBusiness['plan'], 'BASIC' | 'PRO'>

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000
const DEFAULT_BASIC_PRICE = 'R$ 49,90/mês'
const DEFAULT_PRO_PRICE = 'R$ 89,90/mês'

export const PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY?.trim() || 'financeiro@marcacerta.com.br'
export const SUPPORT_WHATSAPP = normalizeWhatsAppNumber(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP) || '5511999999999'
export const BASIC_PRICE = process.env.NEXT_PUBLIC_BASIC_PRICE?.trim() || DEFAULT_BASIC_PRICE
export const PRO_PRICE = process.env.NEXT_PUBLIC_PRO_PRICE?.trim() || DEFAULT_PRO_PRICE

export type SubscriptionLifecycleNotice = {
    type: 'preventive' | 'grace' | 'expired'
    message: string
}

function getCurrentCycleEndsAt(business: AdminBusiness): string | null {
    if (business.subscriptionStatus === 'TRIALING') {
        return business.trialEndsAt
    }

    if (business.subscriptionStatus === 'ACTIVE') {
        return business.subscriptionEndsAt
    }

    return null
}

export function getSubscriptionLifecycleNotice(
    business: AdminBusiness,
    now: number
): SubscriptionLifecycleNotice | null {
    if (business.subscriptionStatus === 'PAST_DUE' || business.subscriptionStatus === 'CANCELED') {
        return {
            type: 'expired',
            message: 'Seu plano expirou. Regularize sua assinatura para continuar.',
        }
    }

    const cycleEndsAt = getCurrentCycleEndsAt(business)

    if (!cycleEndsAt) {
        return null
    }

    const cycleEndsAtTimestamp = new Date(cycleEndsAt).getTime()

    if (!Number.isFinite(cycleEndsAtTimestamp)) {
        return null
    }

    const timeUntilEnd = cycleEndsAtTimestamp - now
    const timeSinceEnd = now - cycleEndsAtTimestamp

    if (timeUntilEnd > 0 && timeUntilEnd <= ONE_DAY_IN_MS) {
        return {
            type: 'preventive',
            message: 'Seu plano vence amanhã. Regularize para evitar interrupções.',
        }
    }

    if (timeSinceEnd >= 0 && timeSinceEnd <= ONE_DAY_IN_MS) {
        return {
            type: 'grace',
            message: 'Seu plano venceu, mas você ainda está no período de tolerância de 1 dia.',
        }
    }

    if (timeSinceEnd > ONE_DAY_IN_MS) {
        return {
            type: 'expired',
            message: 'Seu plano expirou. Regularize sua assinatura para continuar.',
        }
    }

    return null
}

export function shouldShowSubscriptionPaymentCard(business: AdminBusiness, now: number): boolean {
    return getSubscriptionLifecycleNotice(business, now)?.type === 'expired'
}

export function getSubscriptionPaymentWhatsAppUrl(business: AdminBusiness): string {
    const { planLabel, planPrice } = getSubscriptionPlanDetails(business)
    const message = [
        `Olá, equipe MarcaCerta!`,
        `Acabei de realizar o pagamento via Pix do ${planLabel} do negócio ${business.name}, no valor de ${planPrice}.`,
        'Estou enviando o comprovante neste atendimento para confirmar a ativação ou renovação da assinatura.',
        'Se precisarem de mais alguma informação, fico à disposição.',
    ].join('\n')

    return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`
}

function getSubscriptionPlanDetails(business: AdminBusiness) {
    const plan: PaidPlan = business.plan === 'PRO' ? 'PRO' : 'BASIC'

    if (plan === 'PRO') {
        return {
            plan,
            planLabel: 'Plano Pro',
            planPrice: PRO_PRICE,
        }
    }

    return {
        plan,
        planLabel: 'Plano Basic',
        planPrice: BASIC_PRICE,
    }
}

function normalizeWhatsAppNumber(value: string | undefined) {
    const digits = value?.replace(/\D/g, '')

    return digits ? digits : ''
}
