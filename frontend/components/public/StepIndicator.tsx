'use client'

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
                            'rounded-2xl border px-3 py-3 text-left transition sm:px-4 sm:py-3.5',
                            isActive
                                ? 'border-purple-200 bg-purple-50 text-slate-900 shadow-sm shadow-purple-100'
                                : isCompleted
                                    ? 'border-slate-200 bg-slate-50 text-slate-800'
                                    : 'border-slate-200 bg-white text-slate-500',
                        ].join(' ')}
                        aria-current={isActive ? 'step' : undefined}
                    >
                        <div className="flex items-center gap-3">
                            <span
                                className={[
                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold sm:h-8 sm:w-8 sm:text-xs',
                                    isActive
                                        ? 'bg-purple-700 text-white'
                                        : isCompleted
                                            ? 'bg-slate-700 text-white'
                                            : 'bg-slate-100 text-slate-500',
                                ].join(' ')}
                            >
                                {index + 1}
                            </span>

                            <div className="min-w-0">
                                <p
                                    className={[
                                        'truncate text-[11px] uppercase tracking-[.18em] sm:text-xs',
                                        isActive
                                            ? 'text-purple-700'
                                            : isCompleted
                                                ? 'text-slate-500'
                                                : 'text-slate-400',
                                    ].join(' ')}
                                >
                                    Etapa
                                </p>
                                <p
                                    className={[
                                        'truncate text-sm font-semibold sm:text-[15px]',
                                        isActive ? 'text-slate-900' : isCompleted ? 'text-slate-800' : 'text-slate-600',
                                    ].join(' ')}
                                >
                                    {step.label}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
