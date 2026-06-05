'use client'

import { signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getSubscriptionLifecycleNotice } from '../../features/admin/subscription-payment'
import { type AdminBusinessOption, type AdminDashboardData } from '../../features/admin/types'
import { useHydrated } from '../../hooks/use-hydrated'
import { formatIsoCalendarDate } from '../../lib/date-format'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { BusinessSwitcher } from './BusinessSwitcher'

type AdminHeaderProps = {
    business: AdminDashboardData['business']
    businesses: AdminBusinessOption[]
    currentBusinessId: string
    isSwitchingBusiness?: boolean
    userEmail?: string | null
    userName?: string | null
    userRole?: AdminBusinessOption['role'] | null
    onBusinessChange: (businessId: string) => void
}

const roleLabels: Record<AdminBusinessOption['role'], string> = {
    OWNER: 'Dono',
    ADMIN: 'Administrador',
    STAFF: 'Funcionário',
}

const subscriptionStatusLabels: Record<AdminDashboardData['business']['subscriptionStatus'], string> = {
    TRIALING: 'Teste grátis',
    ACTIVE: 'Ativo',
    PAST_DUE: 'Pendente',
    CANCELED: 'Cancelado',
}

const planLabels: Record<AdminDashboardData['business']['plan'], string> = {
    FREE: 'Free',
    BASIC: 'Basic',
    PRO: 'Pro',
}

async function createGravatarHash(email: string) {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        return null
    }

    const normalizedEmail = email.trim().toLowerCase()
    const emailBuffer = new TextEncoder().encode(normalizedEmail)
    const hashBuffer = await crypto.subtle.digest('SHA-256', emailBuffer)

    return Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
}

function resolveUserDisplayName(userName?: string | null, userEmail?: string | null) {
    if (userName?.trim()) {
        return userName.trim()
    }

    if (userEmail?.trim()) {
        return userEmail.split('@')[0] || userEmail
    }

    return 'Usuário'
}

function resolveUserInitials(userName?: string | null, userEmail?: string | null) {
    const displayName = resolveUserDisplayName(userName, userEmail)
    const nameParts = displayName
        .replace(/[^a-zA-ZÀ-ÿ0-9\s._-]/g, ' ')
        .split(/[\s._-]+/)
        .filter(Boolean)

    if (nameParts.length === 0) {
        return 'U'
    }

    return nameParts
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
}

function resolveFirstName(displayName: string) {
    return displayName.split(/\s+/)[0] || displayName
}

export function AdminHeader({
    business,
    businesses,
    currentBusinessId,
    isSwitchingBusiness = false,
    userEmail,
    userName,
    userRole,
    onBusinessChange,
}: AdminHeaderProps) {
    const isHydrated = useHydrated()
    const [gravatarUrl, setGravatarUrl] = useState<string | null>(null)
    const [hasGravatarError, setHasGravatarError] = useState(false)
    const parsedTrialEndsAt = business.trialEndsAt ? new Date(business.trialEndsAt) : null
    const parsedSubscriptionEndsAt = business.subscriptionEndsAt ? new Date(business.subscriptionEndsAt) : null
    const trialEndsAtLabel = formatIsoCalendarDate(business.trialEndsAt)
    const subscriptionEndsAtLabel = formatIsoCalendarDate(business.subscriptionEndsAt)
    const hasValidTrialDate = Boolean(parsedTrialEndsAt && !Number.isNaN(parsedTrialEndsAt.getTime()))
    const hasValidSubscriptionEndDate = Boolean(
        parsedSubscriptionEndsAt && !Number.isNaN(parsedSubscriptionEndsAt.getTime())
    )
    const isTrialing = business.subscriptionStatus === 'TRIALING'
    const isActivePlan = business.subscriptionStatus === 'ACTIVE'
    const subscriptionNotice = isHydrated ? getSubscriptionLifecycleNotice(business, Date.now()) : null
    const shouldShowCurrentTrialBadge = isTrialing && hasValidTrialDate && trialEndsAtLabel && !subscriptionNotice
    const shouldShowCurrentPlanBadge = isActivePlan && hasValidSubscriptionEndDate && subscriptionEndsAtLabel && !subscriptionNotice
    const userDisplayName = resolveUserDisplayName(userName, userEmail)
    const userFirstName = resolveFirstName(userDisplayName)
    const userInitials = resolveUserInitials(userName, userEmail)
    const userRoleLabel = userRole ? roleLabels[userRole] : 'Equipe'
    const shouldShowGravatar = Boolean(gravatarUrl && !hasGravatarError)
    const currentPlanLabel =
        isTrialing && trialEndsAtLabel
            ? `Teste até ${trialEndsAtLabel}`
            : isActivePlan && subscriptionEndsAtLabel
              ? `Plano ativo até ${subscriptionEndsAtLabel}`
              : subscriptionStatusLabels[business.subscriptionStatus]
    const compactPlanLabel =
        isTrialing && trialEndsAtLabel
            ? `Teste grátis até ${trialEndsAtLabel}`
            : isActivePlan && subscriptionEndsAtLabel
              ? `Plano ativo até ${subscriptionEndsAtLabel}`
              : 'Plano vencido'
    const subscriptionNoticeClasses =
        subscriptionNotice?.type === 'expired'
            ? 'border-rose-200 bg-rose-50 text-rose-900'
            : 'border-amber-200 bg-amber-50 text-amber-900'

    useEffect(() => {
        let isCurrent = true

        setHasGravatarError(false)

        if (!userEmail) {
            setGravatarUrl(null)
            return
        }

        createGravatarHash(userEmail)
            .then((hash) => {
                if (isCurrent) {
                    setGravatarUrl(hash ? `https://www.gravatar.com/avatar/${hash}?s=160&d=404&r=g` : null)
                }
            })
            .catch(() => {
                if (isCurrent) {
                    setGravatarUrl(null)
                }
            })

        return () => {
            isCurrent = false
        }
    }, [userEmail])

    return (
        <Card className="border-purple-200 bg-gradient-to-br from-white via-white to-purple-50/80 p-4 sm:p-6 lg:p-8">
            <div className="space-y-3 sm:hidden">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-purple-100 bg-gradient-to-br from-purple-100 via-white to-slate-100 text-xl font-bold text-purple-700 shadow-lg shadow-purple-100/70">
                        <div className="flex h-full w-full items-center justify-center">
                            {shouldShowGravatar ? (
                                <img
                                    src={gravatarUrl ?? undefined}
                                    alt={`Foto de ${userDisplayName}`}
                                    className="h-full w-full object-cover"
                                    onError={() => setHasGravatarError(true)}
                                />
                            ) : (
                                <span>{userInitials}</span>
                            )}
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xl font-semibold text-slate-950">Olá, {userFirstName} 👋</p>
                        <div className="mt-2 flex min-w-0 items-center gap-2">
                            <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-800">
                                {userRoleLabel}
                            </span>
                            <span className="min-w-0 truncate text-xs text-slate-500">{userEmail ?? 'Sessão ativa'}</span>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white px-3.5 py-3 shadow-sm shadow-purple-100/60">
                    {businesses.length > 1 ? (
                        <select
                            aria-label="Negócio atual"
                            value={currentBusinessId}
                            disabled={isSwitchingBusiness}
                            onChange={(event) => onBusinessChange(event.target.value)}
                            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                        >
                            {businesses.map((businessOption) => (
                                <option key={businessOption.id} value={businessOption.id}>
                                    {businessOption.name} ({roleLabels[businessOption.role]})
                                </option>
                            ))}
                        </select>
                    ) : null}

                    <div className="flex min-w-0 items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-slate-950">{business.name}</p>
                            <p className="mt-0.5 truncate text-sm text-slate-500">{userEmail ?? `/${business.slug}`}</p>
                        </div>
                        {businesses.length > 1 ? (
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 20 20"
                                className="h-5 w-5 shrink-0 text-purple-600"
                                fill="none"
                            >
                                <path
                                    d="M5 7.5L10 12.5L15 7.5"
                                    stroke="currentColor"
                                    strokeWidth="1.9"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        ) : null}
                    </div>
                </div>

                <div
                    className={[
                        'w-fit max-w-full truncate rounded-full px-3 py-1.5 text-xs font-semibold',
                        isActivePlan
                            ? 'bg-emerald-100 text-emerald-800'
                            : isTrialing
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-rose-100 text-rose-800',
                    ].join(' ')}
                >
                    {compactPlanLabel}
                </div>

                <Button
                    variant="secondary"
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="min-h-11 w-full rounded-2xl bg-white text-sm font-semibold shadow-sm hover:bg-slate-50"
                >
                    Sair
                </Button>

                {subscriptionNotice ? (
                    <div className={`rounded-2xl border px-3 py-2 text-xs font-medium ${subscriptionNoticeClasses}`}>
                        {subscriptionNotice.message}
                    </div>
                ) : null}
            </div>

            <div className="hidden space-y-4 sm:block">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:items-stretch">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
                            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-purple-100 bg-gradient-to-br from-purple-100 via-white to-slate-100 text-2xl font-bold text-purple-700 shadow-lg shadow-purple-100/70 sm:text-3xl">
                                {shouldShowGravatar ? (
                                    <img
                                        src={gravatarUrl ?? undefined}
                                        alt={`Foto de ${userDisplayName}`}
                                        className="h-full w-full object-cover"
                                        onError={() => setHasGravatarError(true)}
                                    />
                                ) : (
                                    <span>{userInitials}</span>
                                )}
                            </div>
                        </div>

                        <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-semibold uppercase tracking-[.3em] text-purple-700 sm:text-sm">
                                    Painel admin
                                </p>
                                {shouldShowCurrentTrialBadge ? (
                                    <span className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.18em] text-purple-800">
                                        Teste grátis até {trialEndsAtLabel}
                                    </span>
                                ) : null}
                                {shouldShowCurrentPlanBadge ? (
                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.18em] text-emerald-800">
                                        Plano ativo até {subscriptionEndsAtLabel}
                                    </span>
                                ) : null}
                            </div>
                            <div className="min-w-0 space-y-2">
                                <h1 className="truncate text-[1.65rem] font-semibold text-slate-950 sm:text-3xl">
                                    {userDisplayName}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-800">
                                        {userRoleLabel}
                                    </span>
                                    <span className="min-w-0 break-all text-sm text-slate-600">
                                        {userEmail ?? 'Sessão ativa'}
                                    </span>
                                </div>
                            </div>
                            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                Gestão do negócio <span className="font-semibold text-slate-900">{business.name}</span>.
                            </p>
                        </div>
                    </div>

                    <div className="min-w-0 rounded-3xl border border-purple-100 bg-white/85 p-3.5 shadow-lg shadow-purple-100/50 sm:p-4">
                        <BusinessSwitcher
                            businesses={businesses}
                            currentBusinessId={currentBusinessId}
                            disabled={isSwitchingBusiness}
                            onChange={onBusinessChange}
                        />

                        <div className={businesses.length > 1 ? 'mt-3 space-y-3' : 'space-y-3'}>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-slate-500">
                                    Negócio atual
                                </p>
                                <p className="mt-1 truncate text-base font-semibold text-slate-950">{business.name}</p>
                                <p className="mt-0.5 break-all text-sm text-slate-600">/{business.slug}</p>
                            </div>

                            <div className="grid gap-2 text-sm sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-slate-500">
                                        Plano
                                    </p>
                                    <p className="mt-1 font-semibold text-slate-900">{planLabels[business.plan]}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-slate-500">
                                        Status
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <span
                                            className={[
                                                'rounded-full px-2.5 py-1 text-xs font-semibold',
                                                isActivePlan
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : isTrialing
                                                      ? 'bg-purple-100 text-purple-800'
                                                      : 'bg-amber-100 text-amber-800',
                                            ].join(' ')}
                                        >
                                            {subscriptionStatusLabels[business.subscriptionStatus]}
                                        </span>
                                        <span className="text-xs text-slate-500">{currentPlanLabel}</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="min-h-12 w-full rounded-2xl bg-white text-base shadow-sm hover:bg-slate-50"
                            >
                                Sair
                            </Button>
                        </div>
                    </div>
                </div>

                {subscriptionNotice ? (
                    <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${subscriptionNoticeClasses}`}>
                        {subscriptionNotice.message}
                    </div>
                ) : null}
            </div>
        </Card>
    )
}
