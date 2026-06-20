'use client'

import {
    BadgeDollarSign,
    CalendarCheck2,
    ClipboardCheck,
    Clock3,
    Phone,
    UserRound,
    type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

export type BookingReviewDetails = {
    serviceName?: string
    dateTimeLabel?: string
    durationLabel?: string
    priceLabel?: string
    customerName?: string
    phone?: string
}

type BookingReviewDetailsGridProps = {
    details: BookingReviewDetails
    compact?: boolean
}

type BookingReviewCardProps = BookingReviewDetailsGridProps & {
    className?: string
    submitLabel: string
    submittingLabel?: string
    isSubmitting?: boolean
    onBack: () => void
    notice?: string
    error?: string | null
}

type ReviewItem = {
    label: string
    value: string
    icon: LucideIcon
}

function buildReviewItems(details: BookingReviewDetails): ReviewItem[] {
    return [
        {
            label: 'Reserva online',
            value: details.serviceName || 'Não selecionado',
            icon: ClipboardCheck,
        },
        {
            label: 'Data e horário',
            value: details.dateTimeLabel || 'Não selecionado',
            icon: CalendarCheck2,
        },
        {
            label: 'Duração',
            value: details.durationLabel || 'Não selecionada',
            icon: Clock3,
        },
        {
            label: 'Valor',
            value: details.priceLabel || 'Não selecionado',
            icon: BadgeDollarSign,
        },
        {
            label: 'Cliente',
            value: details.customerName || 'Não informado',
            icon: UserRound,
        },
        {
            label: 'Telefone',
            value: details.phone || 'Não informado',
            icon: Phone,
        },
    ]
}

export function BookingReviewDetailsGrid({ details, compact = false }: BookingReviewDetailsGridProps) {
    const items = buildReviewItems(details)

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className={cn('grid', compact ? '' : 'sm:grid-cols-2')}>
                {items.map((item, index) => {
                    const Icon = item.icon
                    const hasBottomBorder = index < items.length - 1
                    const isDesktopLastRow = !compact && index >= items.length - 2
                    const hasRightBorder = !compact && index % 2 === 0

                    return (
                        <div
                            key={item.label}
                            className={cn(
                                'flex min-h-[6.75rem] items-center gap-3 bg-white px-4 py-4 sm:min-h-[7.75rem] sm:px-5',
                                compact ? 'min-h-[5.25rem] sm:min-h-[5.75rem]' : '',
                                hasBottomBorder ? 'border-b border-slate-200' : '',
                                isDesktopLastRow ? 'sm:border-b-0' : '',
                                hasRightBorder ? 'sm:border-r sm:border-slate-200' : '',
                                compact && index === items.length - 1 ? 'border-b-0' : '',
                            )}
                        >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 ring-1 ring-purple-100 sm:h-11 sm:w-11">
                                <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>

                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                                <p className="mt-1 break-words text-base font-semibold leading-snug text-slate-950 sm:text-lg">
                                    {item.value}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export function BookingReviewCard({
    details,
    className,
    submitLabel,
    submittingLabel = 'Confirmando...',
    isSubmitting = false,
    onBack,
    notice,
    error,
}: BookingReviewCardProps) {
    return (
        <Card className={cn('border-purple-100 bg-white shadow-xl shadow-purple-100/60', className)}>
            <div className="space-y-6 sm:space-y-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 ring-8 ring-purple-50 sm:h-24 sm:w-24">
                        <CalendarCheck2 className="h-10 w-10" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[.28em] text-purple-700 sm:text-sm">
                            Etapa 4
                        </p>
                        <h2 className="text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
                            Confira e confirme
                        </h2>
                        <p className="text-sm leading-6 text-slate-600 sm:text-base">
                            Revise os dados abaixo antes de confirmar sua reserva.
                        </p>
                    </div>
                </div>

                <BookingReviewDetailsGrid details={details} />

                {notice ? (
                    <p className="rounded-2xl border border-purple-100 bg-purple-50/70 px-4 py-3 text-sm leading-6 text-slate-700">
                        {notice}
                    </p>
                ) : null}

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <div className="grid gap-3 sm:grid-cols-[minmax(9rem,13rem)_1fr] sm:items-center sm:gap-5">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onBack}
                        disabled={isSubmitting}
                        className="min-h-14 rounded-2xl bg-slate-100 text-base text-slate-950 shadow-sm shadow-slate-200/70 hover:bg-slate-200 sm:w-full"
                    >
                        Voltar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="min-h-14 rounded-2xl bg-purple-700 text-base shadow-lg shadow-purple-200/80 hover:bg-purple-800 sm:w-full"
                    >
                        {isSubmitting ? submittingLabel : submitLabel}
                    </Button>
                </div>
            </div>
        </Card>
    )
}
