'use client'

import { BASIC_PRICE, PIX_KEY, PRO_PRICE, getSubscriptionPaymentWhatsAppUrl } from '../../features/admin/subscription-payment'
import { type AdminDashboardData } from '../../features/admin/types'
import { Card } from '../ui/card'

type SubscriptionPaymentCardProps = {
    business: AdminDashboardData['business']
}

export function SubscriptionPaymentCard({ business }: SubscriptionPaymentCardProps) {
    const whatsappUrl = getSubscriptionPaymentWhatsAppUrl(business)

    return (
        <Card className="border-amber-200 bg-amber-50 shadow-lg shadow-amber-100/60">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-3">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[.22em] text-amber-800">
                            Ative seu plano
                        </p>
                        <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                            Pague via Pix e envie o comprovante pelo WhatsApp.
                        </h2>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500">Plano Basic</p>
                            <p className="mt-1 text-lg font-semibold text-slate-950">{BASIC_PRICE}</p>
                        </div>
                        <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500">Plano Pro</p>
                            <p className="mt-1 text-lg font-semibold text-slate-950">{PRO_PRICE}</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500">Chave Pix</p>
                        <p className="mt-1 break-all text-sm font-semibold text-slate-950 sm:text-base">{PIX_KEY}</p>
                    </div>
                </div>

                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-700 px-4 py-3 text-center text-base font-semibold leading-tight text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 sm:px-6 sm:text-sm lg:w-auto lg:min-w-[260px]"
                >
                    Enviar comprovante pelo WhatsApp
                </a>
            </div>
        </Card>
    )
}
