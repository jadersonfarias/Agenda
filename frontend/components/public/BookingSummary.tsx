'use client'

import { Button } from '../ui/button'
import { Card } from '../ui/card'

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

    return (
        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
            <div className="space-y-3 sm:space-y-4">
                <div>
                    <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Resumo</p>
                    <h2 className="mt-1.5 text-lg font-semibold text-slate-900 sm:mt-2 sm:text-2xl">Sua reserva</h2>
                </div>

                {hasSummaryData ? (
                    <div className="space-y-2.5 text-sm text-slate-600 sm:space-y-3">
                        {serviceName ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 sm:px-4">
                                <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Serviço</span>
                                <span className="mt-1 block font-medium text-slate-900">{serviceName}</span>
                            </div>
                        ) : null}

                        {durationMinutes ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 sm:px-4">
                                <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Duração</span>
                                <span className="mt-1 block font-medium text-slate-900">{durationMinutes} min</span>
                            </div>
                        ) : null}

                        {price ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 sm:px-4">
                                <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Preço</span>
                                <span className="mt-1 block font-medium text-slate-900">R$ {Number(price).toFixed(2)}</span>
                            </div>
                        ) : null}

                        {dateLabel || time ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 sm:px-4">
                                <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Data e horário</span>
                                <span className="mt-1 block font-medium text-slate-900">
                                    {dateLabel && time ? `${dateLabel} às ${time}` : dateLabel || time}
                                </span>
                            </div>
                        ) : null}

                        {customerName ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 sm:px-4">
                                <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Cliente</span>
                                <span className="mt-1 block font-medium text-slate-900">{customerName}</span>
                            </div>
                        ) : null}

                        {phone ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 sm:px-4">
                                <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Telefone</span>
                                <span className="mt-1 block font-medium text-slate-900">{phone}</span>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/50 px-4 py-3.5">
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
