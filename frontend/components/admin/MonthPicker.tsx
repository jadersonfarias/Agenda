'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

const monthLabels = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

type MonthPickerProps = {
    value: string
    onChange: (value: string) => void
    className?: string
}

function parseMonthValue(value: string) {
    const [rawYear, rawMonth] = value.split('-')
    const year = Number(rawYear)
    const monthIndex = Number(rawMonth) - 1

    if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        const currentDate = new Date()
        return {
            year: currentDate.getFullYear(),
            monthIndex: currentDate.getMonth(),
        }
    }

    return { year, monthIndex }
}

function formatMonthValue(year: number, monthIndex: number) {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

function formatMonthLabel(year: number, monthIndex: number) {
    const formattedLabel = new Date(year, monthIndex, 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
    })

    return formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1)
}

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const { year, monthIndex } = useMemo(() => parseMonthValue(value), [value])
    const [isOpen, setIsOpen] = useState(false)
    const [visibleYear, setVisibleYear] = useState(year)

    useEffect(() => {
        setVisibleYear(year)
    }, [year])

    useEffect(() => {
        if (isOpen) {
            setVisibleYear(year)
        }
    }, [isOpen, year])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        function handlePointerDown(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false)
                buttonRef.current?.focus()
            }
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen])

    return (
        <div ref={rootRef} className={cn('relative w-full', className)}>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => {
                    setVisibleYear(year)
                    setIsOpen((currentValue) => !currentValue)
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 shadow-sm transition hover:border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-200"
                aria-haspopup="dialog"
                aria-expanded={isOpen}
            >
                <span className="truncate">{formatMonthLabel(year, monthIndex)}</span>
                <span className="ml-3 shrink-0 text-xs text-slate-500">Selecionar mês</span>
            </button>

            {isOpen ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 sm:left-auto sm:right-0 sm:w-[320px]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => setVisibleYear((currentYear) => currentYear - 1)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl font-semibold leading-none text-slate-700 transition hover:border-purple-200 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
                            aria-label="Ano anterior"
                        >
                            <span aria-hidden="true" className="-mt-0.5 flex items-center justify-center">‹</span>
                        </button>

                        <p className="text-sm font-semibold text-slate-900">{visibleYear}</p>

                        <button
                            type="button"
                            onClick={() => setVisibleYear((currentYear) => currentYear + 1)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl font-semibold leading-none text-slate-700 transition hover:border-purple-200 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
                            aria-label="Próximo ano"
                        >
                            <span aria-hidden="true" className="-mt-0.5 flex items-center justify-center">›</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {monthLabels.map((label, index) => {
                            const monthValue = formatMonthValue(visibleYear, index)
                            const isSelected = monthValue === value

                            return (
                                <button
                                    key={monthValue}
                                    type="button"
                                    onClick={() => {
                                        onChange(monthValue)
                                        setIsOpen(false)
                                    }}
                                    className={cn(
                                        'rounded-2xl border px-2.5 py-2 text-xs font-semibold uppercase transition focus:outline-none focus:ring-2 focus:ring-purple-200 sm:px-3 sm:py-3 sm:text-sm',
                                        isSelected
                                            ? 'border-purple-200 bg-purple-700 text-white'
                                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-purple-200 hover:text-purple-700'
                                    )}
                                >
                                    {label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
