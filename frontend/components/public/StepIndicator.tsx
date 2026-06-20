'use client'

import { Check } from 'lucide-react'

type BookingStep = 'service' | 'details' | 'schedule' | 'review'

type StepIndicatorProps = {
    currentStep: BookingStep
    steps: Array<{
        id: BookingStep
        label: string
    }>
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
    const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

    return (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {steps.map((step, index) => {
                const isActive = currentStep === step.id
                const isCompleted = currentStepIndex > index

                return (
                    <div
                        key={step.id}
                        className={[
                            'flex min-h-[5.25rem] items-center rounded-2xl border px-3 py-3 text-left transition sm:px-4',
                            isActive
                                ? 'border-purple-200 bg-purple-50 text-purple-700 shadow-sm shadow-purple-100'
                                : isCompleted
                                    ? 'border-slate-200 bg-white text-slate-900'
                                    : 'border-slate-200 bg-white text-slate-500',
                        ].join(' ')}
                        aria-current={isActive ? 'step' : undefined}
                    >
                        <div className="flex w-full items-center gap-3">
                            <span
                                className={[
                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold sm:h-11 sm:w-11 sm:text-base',
                                    isActive
                                        ? 'bg-purple-700 text-white'
                                        : isCompleted
                                            ? 'bg-slate-950 text-white'
                                            : 'bg-slate-100 text-slate-500',
                                ].join(' ')}
                            >
                                {index + 1}
                            </span>

                            <div className="min-w-0 flex-1">
                                <p
                                    className={[
                                        'text-sm font-semibold leading-snug sm:text-base',
                                        isActive ? 'text-purple-700' : isCompleted ? 'text-slate-900' : 'text-slate-600',
                                    ].join(' ')}
                                >
                                    {step.label}
                                </p>
                            </div>

                            {isCompleted ? (
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                                    <Check className="h-4 w-4" aria-hidden="true" />
                                </span>
                            ) : null}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
