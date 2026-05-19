import { type AdminDashboardData } from './types'

export const PIX_KEY = 'sua-chave-pix@exemplo.com'
export const SUPPORT_WHATSAPP = '5500000000000'
export const BASIC_PRICE = 'R$ 49,90/mês'
export const PRO_PRICE = 'R$ 89,90/mês'

type AdminBusiness = AdminDashboardData['business']

export function hasExpiredTrial(business: AdminBusiness, now: number): boolean {
    if (business.subscriptionStatus !== 'TRIALING' || !business.trialEndsAt) {
        return false
    }

    const trialEndsAt = new Date(business.trialEndsAt).getTime()

    return Number.isFinite(trialEndsAt) && trialEndsAt < now
}

export function shouldShowSubscriptionPaymentCard(business: AdminBusiness, now: number): boolean {
    return (
        business.subscriptionStatus === 'PAST_DUE' ||
        business.subscriptionStatus === 'CANCELED' ||
        hasExpiredTrial(business, now)
    )
}

export function getSubscriptionPaymentWhatsAppUrl(businessName: string): string {
    const message = [
        `Olá, enviei o comprovante Pix para ativar o plano do negócio ${businessName}.`,
        `Chave Pix: ${PIX_KEY}`,
    ].join('\n')

    return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`
}
