'use client'

import {
    CalendarCheck2,
    CalendarDays,
    Clock3,
    Info,
    Store,
} from 'lucide-react'
import { StepIndicator } from './StepIndicator'

type BookingStep = 'service' | 'details' | 'schedule' | 'review'

type BookingIntroCardProps = {
    eyebrow: string
    title: string
    description: string
    businessName: string
    hoursLabel: string
    servicesLabel: string
    reservationLabel?: string
    currentStep: BookingStep
    steps: Array<{
        id: BookingStep
        label: string
    }>
}

export function BookingIntroCard({
    eyebrow,
    title,
    description,
    businessName,
    hoursLabel,
    servicesLabel,
    reservationLabel = 'Simples e rápida',
    currentStep,
    steps,
}: BookingIntroCardProps) {
    const metrics = [
        {
            label: 'Negócio',
            value: businessName,
            icon: Store,
        },
        {
            label: 'Funcionamento',
            value: hoursLabel,
            icon: Clock3,
        },
        {
            label: 'Serviços',
            value: servicesLabel,
            icon: CalendarCheck2,
        },
        {
            label: 'Reserva online',
            value: reservationLabel,
            icon: CalendarDays,
        },
    ]

    return (
        <section className="w-full rounded-[1.75rem] border border-purple-200 bg-white px-4 py-6 shadow-xl shadow-purple-100/50 sm:rounded-3xl sm:px-7 sm:py-8 lg:px-10 lg:py-10">
            <div className="space-y-6 sm:space-y-7">
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[.3em] text-purple-700 sm:text-sm">
                        {eyebrow}
                    </p>
                    <h1 className="max-w-4xl text-[1.8rem] font-semibold leading-tight text-slate-950 sm:text-4xl lg:text-[2.7rem]">
                        {title}
                    </h1>
                    <p className="max-w-4xl text-sm leading-6 text-slate-600 sm:text-base">
                        {description}
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((metric) => {
                        const Icon = metric.icon

                        return (
                            <div
                                key={metric.label}
                                className="flex min-h-[7.5rem] items-center gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-slate-100/80"
                            >
                                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                                    <Icon className="h-7 w-7" aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                                    <p className="mt-1 break-words text-base font-semibold leading-snug text-slate-950 sm:text-lg">
                                        {metric.value}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="flex flex-col gap-3 rounded-3xl border border-purple-100 bg-purple-50/40 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
                    <div className="flex shrink-0 items-center gap-3 text-purple-700">
                        <Info className="h-6 w-6" aria-hidden="true" />
                        <p className="text-xs font-semibold uppercase tracking-[.2em] sm:text-sm">
                            Como funciona
                        </p>
                    </div>
                    <div className="hidden h-8 w-px bg-purple-100 sm:block" aria-hidden="true" />
                    <p className="text-sm leading-6 text-slate-700 sm:text-base">
                        Escolha um serviço, preencha seus dados, selecione um horário livre e confirme a reserva.
                    </p>
                </div>

                <StepIndicator currentStep={currentStep} steps={steps} />
            </div>
        </section>
    )
}
