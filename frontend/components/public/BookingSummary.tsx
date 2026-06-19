'use client'

import { CalendarCheck2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { BookingReviewDetailsGrid } from './BookingReviewDetails'

type BookingSummaryProps = {
    serviceName?: string
    durationMinutes?: number
    price?: string
    dateLabel?: string
    time?: string
    customerName?: string
    phone?: string
    isReviewStep: boolean
    isSubmitting: boolean
}

export function BookingSummary({
    serviceName,
    durationMinutes,
    price,
    dateLabel,
    time,
    customerName,
    phone,
    isReviewStep,
    isSubmitting,
}: BookingSummaryProps) {
    const hasSummaryData = Boolean(serviceName || durationMinutes || price || dateLabel || time || customerName || phone)
    const priceLabel = price ? `R$ ${Number(price).toFixed(2)}` : undefined
    const dateTimeLabel = dateLabel && time ? `${dateLabel} às ${time}` : dateLabel || time

    return (
        <Card className="border-purple-100 bg-white shadow-lg shadow-purple-100/50">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                        <CalendarCheck2 className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[.25em] text-purple-700 sm:text-sm">Resumo</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-950 sm:text-2xl">Sua reserva</h2>
                    </div>
                </div>

                {hasSummaryData ? (
                    <BookingReviewDetailsGrid
                        compact
                        details={{
                            serviceName,
                            dateTimeLabel,
                            durationLabel: durationMinutes ? `${durationMinutes} min` : undefined,
                            priceLabel,
                            customerName,
                            phone,
                        }}
                    />
                ) : (
                    <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/50 px-3.5 py-3 sm:px-4 sm:py-3.5">
                        <p className="text-sm font-medium text-slate-900">
                            Comece escolhendo um serviço para montar sua reserva.
                        </p>
                    </div>
                )}

                {isReviewStep ? (
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="hidden min-h-11 w-full lg:min-h-12 xl:inline-flex"
                    >
                        {isSubmitting ? 'Agendando...' : 'Confirmar reserva'}
                    </Button>
                ) : (
                    <Button
                        type="button"
                        disabled
                        className="hidden min-h-11 w-full lg:min-h-12 xl:inline-flex"
                    >
                        Continue pelas etapas para confirmar
                    </Button>
                )}
            </div>
        </Card>
    )
}
