'use client'

import { format } from 'date-fns'
import { signOut } from 'next-auth/react'
import { type AdminBusinessOption, type AdminDashboardData } from '../../features/admin/types'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { BusinessSwitcher } from './BusinessSwitcher'

type AdminHeaderProps = {
    business: AdminDashboardData['business']
    businesses: AdminBusinessOption[]
    currentBusinessId: string
    isSwitchingBusiness?: boolean
    userEmail?: string | null
    onBusinessChange: (businessId: string) => void
}

export function AdminHeader({
    business,
    businesses,
    currentBusinessId,
    isSwitchingBusiness = false,
    userEmail,
    onBusinessChange,
}: AdminHeaderProps) {
    const parsedTrialEndsAt = business.trialEndsAt ? new Date(business.trialEndsAt) : null
    const hasValidTrialDate = Boolean(parsedTrialEndsAt && !Number.isNaN(parsedTrialEndsAt.getTime()))
    const isTrialing = business.subscriptionStatus === 'TRIALING'
    const hasExpiredTrial = Boolean(
        isTrialing &&
        parsedTrialEndsAt &&
        !Number.isNaN(parsedTrialEndsAt.getTime()) &&
        parsedTrialEndsAt.getTime() < Date.now()
    )

    return (
        <Card className="border-purple-200 bg-gradient-to-br from-white via-white to-purple-50">
            <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0 space-y-2 sm:space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Painel admin</p>
                            {isTrialing && hasValidTrialDate && !hasExpiredTrial ? (
                                <span className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.18em] text-purple-800">
                                    Teste grátis até {format(parsedTrialEndsAt as Date, 'dd/MM/yyyy')}
                                </span>
                            ) : null}
                        </div>
                        <h1 className="text-[1.65rem] font-semibold text-slate-900 sm:text-3xl lg:text-4xl">Gestão do salão</h1>
                        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                            Ajuste a vitrine de serviços e a janela de atendimento do negócio <span className="font-semibold">{business.name}</span>.
                        </p>
                    </div>

                    <div className="grid w-full gap-3 md:grid-cols-2 lg:w-auto lg:min-w-[360px] lg:grid-cols-1 xl:grid-cols-[minmax(0,240px)_minmax(0,1fr)_auto] xl:items-end">
                        <BusinessSwitcher
                            businesses={businesses}
                            currentBusinessId={currentBusinessId}
                            disabled={isSwitchingBusiness}
                            onChange={onBusinessChange}
                        />
                        <div className="min-w-0 rounded-2xl border border-purple-100 bg-white px-4 py-3 text-xs text-slate-600 sm:text-sm">
                            <div className="truncate font-medium text-slate-900">{business.slug}</div>
                            <div className="break-all leading-5">{userEmail ?? 'Sessão ativa'}</div>
                        </div>
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="min-h-12 lg:min-h-0 sm:w-auto"
                        >
                            Sair
                        </Button>
                    </div>
                </div>

                {hasExpiredTrial ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Seu período de teste expirou. Entre em contato para ativar.
                    </div>
                ) : null}
            </div>
        </Card>
    )
}
