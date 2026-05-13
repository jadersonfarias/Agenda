'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { type AdminBusinessSettings } from '../../features/admin/types'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

const DEFAULT_OPEN_TIME = '09:00'
const DEFAULT_CLOSE_TIME = '18:00'
const PUBLIC_LINK_COPIED_STORAGE_KEY = 'admin.onboarding.public-link-copied'

type OnboardingChecklistProps = {
    business: AdminBusinessSettings
    servicesCount: number
    membershipsCount: number
    pendingInvitationsCount: number
    onOpenServices: () => void
    onOpenSettings: () => void
    onOpenTeam: () => void
}

type ChecklistStep = {
    id: 'service' | 'hours' | 'public-link' | 'team'
    title: string
    description: string
    done: boolean
    optional?: boolean
    actionLabel: string
    actionVariant?: 'default' | 'secondary'
    onAction: () => void | Promise<void>
}

function getPublicLinkStorageKey(businessId: string) {
    return `${PUBLIC_LINK_COPIED_STORAGE_KEY}.${businessId}`
}

export function OnboardingChecklist({
    business,
    servicesCount,
    membershipsCount,
    pendingInvitationsCount,
    onOpenServices,
    onOpenSettings,
    onOpenTeam,
}: OnboardingChecklistProps) {
    const [hasCopiedPublicLink, setHasCopiedPublicLink] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        setHasCopiedPublicLink(window.localStorage.getItem(getPublicLinkStorageKey(business.id)) === 'true')
    }, [business.id])

    const hasCreatedFirstService = servicesCount > 0
    const hasConfiguredBusinessHours =
        business.openTime !== DEFAULT_OPEN_TIME || business.closeTime !== DEFAULT_CLOSE_TIME
    const hasInvitedOrAddedStaff = membershipsCount > 1 || pendingInvitationsCount > 0

    const copyPublicBookingLink = async () => {
        if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.clipboard) {
            toast.error('Não foi possível copiar o link neste navegador')
            return
        }

        try {
            const publicLink = `${window.location.origin}/b/${business.slug}`

            await navigator.clipboard.writeText(publicLink)
            window.localStorage.setItem(getPublicLinkStorageKey(business.id), 'true')
            setHasCopiedPublicLink(true)
            toast.success('Link público copiado')
        } catch {
            toast.error('Não foi possível copiar o link agora')
        }
    }

    const steps = useMemo<ChecklistStep[]>(
        () => [
            {
                id: 'service',
                title: 'Criar primeiro serviço',
                description: hasCreatedFirstService
                    ? 'Seu catálogo inicial já está pronto para receber reservas.'
                    : 'Cadastre pelo menos um serviço para liberar o fluxo público de agendamento.',
                done: hasCreatedFirstService,
                actionLabel: hasCreatedFirstService ? 'Ver serviços' : 'Criar serviço',
                actionVariant: hasCreatedFirstService ? 'secondary' : 'default',
                onAction: onOpenServices,
            },
            {
                id: 'hours',
                title: 'Configurar horário de funcionamento',
                description: hasConfiguredBusinessHours
                    ? `Funcionamento atual: ${business.openTime} às ${business.closeTime}.`
                    : 'Defina o horário real do negócio para melhorar a disponibilidade exibida.',
                done: hasConfiguredBusinessHours,
                actionLabel: hasConfiguredBusinessHours ? 'Editar horários' : 'Configurar horários',
                actionVariant: hasConfiguredBusinessHours ? 'secondary' : 'default',
                onAction: onOpenSettings,
            },
            {
                id: 'public-link',
                title: 'Copiar link público de agendamento',
                description: hasCopiedPublicLink
                    ? `Link público pronto para compartilhar: /b/${business.slug}.`
                    : 'Copie o link público para divulgar a agenda do negócio por WhatsApp, Instagram ou site.',
                done: hasCopiedPublicLink,
                actionLabel: hasCopiedPublicLink ? 'Copiar novamente' : 'Copiar link',
                actionVariant: hasCopiedPublicLink ? 'secondary' : 'default',
                onAction: copyPublicBookingLink,
            },
            {
                id: 'team',
                title: 'Convidar funcionário',
                description: hasInvitedOrAddedStaff
                    ? 'Sua equipe já tem pelo menos mais uma pessoa ou convite pendente.'
                    : 'Opcional: convide alguém da equipe para ajudar no atendimento e operação.',
                done: hasInvitedOrAddedStaff,
                optional: true,
                actionLabel: hasInvitedOrAddedStaff ? 'Gerenciar equipe' : 'Convidar pessoa',
                actionVariant: 'secondary',
                onAction: onOpenTeam,
            },
        ],
        [
            business.closeTime,
            business.openTime,
            business.slug,
            hasConfiguredBusinessHours,
            hasCopiedPublicLink,
            hasCreatedFirstService,
            hasInvitedOrAddedStaff,
            onOpenServices,
            onOpenSettings,
            onOpenTeam,
        ]
    )

    const requiredSteps = steps.filter((step) => !step.optional)
    const completedRequiredSteps = requiredSteps.filter((step) => step.done).length
    const hasPendingRequiredSteps = completedRequiredSteps < requiredSteps.length

    if (!hasPendingRequiredSteps) {
        return null
    }

    return (
        <Card className="border-purple-300 bg-gradient-to-br from-white via-purple-50/70 to-slate-50 p-4 shadow-lg shadow-purple-100/70 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-purple-100 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:pb-5">
                <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[.24em] text-purple-700 sm:text-xs sm:tracking-[.3em]">
                        Onboarding inicial
                    </p>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Configure seu negócio mais rápido</h2>
                        <p className="mt-1 text-sm text-slate-600 sm:text-base">
                            O sistema já está liberado. Falta só ajustar alguns pontos para deixar a operação redonda.
                        </p>
                    </div>
                </div>

                <div className="inline-flex w-fit items-center rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800">
                    {completedRequiredSteps} de {requiredSteps.length} etapas principais concluídas
                </div>
            </div>

            <div className="mt-4 grid gap-3 sm:mt-5 lg:grid-cols-2">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={cn(
                            'rounded-3xl border p-4 transition sm:p-5',
                            step.done
                                ? 'border-emerald-200 bg-emerald-50/70'
                                : 'border-purple-200 bg-white/95 shadow-sm shadow-purple-100/60'
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                                    step.done ? 'bg-emerald-600 text-white' : 'bg-purple-100 text-purple-700'
                                )}
                            >
                                {step.done ? 'OK' : index + 1}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{step.title}</h3>
                                    <span
                                        className={cn(
                                            'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                                            step.done
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600'
                                        )}
                                    >
                                        {step.done ? 'Concluída' : step.optional ? 'Opcional' : 'Pendente'}
                                    </span>
                                </div>

                                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>

                                <div className="mt-4">
                                    <Button
                                        type="button"
                                        variant={step.actionVariant ?? (step.done ? 'secondary' : 'default')}
                                        onClick={step.onAction}
                                        className="min-h-11 w-full sm:min-h-0 sm:w-auto"
                                    >
                                        {step.actionLabel}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
