'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { availabilityFormSchema, type AvailabilityFormValues } from '../../features/admin/schemas'
import { type AdminDashboardData } from '../../features/admin/types'
import { updateAdminAvailability } from '../../features/admin/services/admin-api.service'
import { notify } from '../../lib/toast'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'

type AvailabilitySectionProps = {
    business: AdminDashboardData['business']
    onSaved: (business: AdminDashboardData['business']) => void
}

type AvailabilityTimeFieldProps = {
    label: string
    placeholder: string
    helperText: string
    shortcuts: readonly string[]
    value: string
    error?: string
    onChange: (value: string) => void
    onBlur: () => void
}

const OPENING_SHORTCUTS = ['06:00', '07:00', '08:00', '09:00'] as const
const CLOSING_SHORTCUTS = ['17:00', '18:00', '19:00', '20:00'] as const

function formatManualTimeValue(value: string) {
    const sanitized = value.replace(/[^\d:]/g, '').slice(0, 5)

    if (sanitized.includes(':')) {
        const [rawHours = '', rawMinutes = ''] = sanitized.split(':', 2)
        const hours = rawHours.slice(0, 2)
        const minutes = rawMinutes.slice(0, 2)

        if (!minutes && sanitized.endsWith(':')) {
            return `${hours}:`
        }

        return minutes ? `${hours}:${minutes}` : hours
    }

    const digits = sanitized.replace(/\D/g, '').slice(0, 4)

    if (digits.length <= 2) {
        return digits
    }

    return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function normalizeManualTimeValue(value: string) {
    const formatted = formatManualTimeValue(value.trim())

    if (/^\d:\d{2}$/.test(formatted)) {
        const [hours, minutes] = formatted.split(':')
        return `${hours.padStart(2, '0')}:${minutes}`
    }

    return formatted
}

function timeButtonClass(isSelected: boolean) {
    if (isSelected) {
        return 'border-purple-700 bg-purple-700 text-white shadow-sm shadow-purple-200'
    }

    return 'border-slate-200 bg-slate-50 text-slate-700 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700'
}

function AvailabilityTimeField({
    label,
    placeholder,
    helperText,
    shortcuts,
    value,
    error,
    onChange,
    onBlur,
}: AvailabilityTimeFieldProps) {
    return (
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
            <div className="space-y-1">
                <span className="text-sm font-medium text-slate-900 sm:text-base">{label}</span>
            </div>

            <Input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(formatManualTimeValue(event.target.value))}
                onBlur={() => {
                    onChange(normalizeManualTimeValue(value))
                    onBlur()
                }}
            />

            <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Atalhos rápidos</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {shortcuts.map((time) => (
                        <button
                            key={`${label}-${time}`}
                            type="button"
                            onClick={() => onChange(time)}
                            className={`min-h-11 rounded-2xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-purple-200 ${timeButtonClass(value === time)}`}
                        >
                            {time}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-xs text-slate-500 sm:text-sm">{helperText}</p>

            {error ? <p className="text-xs text-red-600 sm:text-sm">{error}</p> : null}
        </div>
    )
}

export function AvailabilitySection({ business, onSaved }: AvailabilitySectionProps) {
    const [isSaving, setIsSaving] = useState(false)
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<AvailabilityFormValues>({
        resolver: zodResolver(availabilityFormSchema),
        defaultValues: {
            openTime: business.openTime,
            closeTime: business.closeTime,
        },
    })

    const onSubmit = handleSubmit(async (values) => {
        setIsSaving(true)

        try {
            const data = await updateAdminAvailability({
                businessId: business.id,
                ...values,
            })
            reset({
                openTime: data.openTime,
                closeTime: data.closeTime,
            })
            onSaved(data)
            notify.success('Horários atualizados com sucesso')
        } catch (error) {
            notify.error(error instanceof Error ? error.message : 'Erro ao salvar horários')
        } finally {
            setIsSaving(false)
        }
    })

    return (
        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
            <div className="mb-4 sm:mb-6">
                <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Disponibilidade</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Horários disponíveis</h2>
                <p className="mt-2 max-w-2xl text-xs text-slate-600 sm:text-sm">
                    Defina a faixa horária usada no link de agendamento para calcular os horários livres do negócio.
                </p>
            </div>

            <form className="grid gap-4" onSubmit={onSubmit}>
                <div className="grid gap-4 xl:grid-cols-2">
                    <Controller
                        control={control}
                        name="openTime"
                        render={({ field }) => (
                            <AvailabilityTimeField
                                label="Abertura"
                                placeholder="Ex: 08:15"
                                helperText="Digite no formato HH:mm. Exemplo: 08:15"
                                shortcuts={OPENING_SHORTCUTS}
                                value={field.value}
                                error={errors.openTime?.message}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="closeTime"
                        render={({ field }) => (
                            <AvailabilityTimeField
                                label="Encerramento"
                                placeholder="Ex: 19:30"
                                helperText="Digite no formato HH:mm. Exemplo: 19:30"
                                shortcuts={CLOSING_SHORTCUTS}
                                value={field.value}
                                error={errors.closeTime?.message}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                            />
                        )}
                    />
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-slate-600 sm:text-sm">
                        Agenda atual: <span className="font-semibold text-slate-900">{business.openTime}</span> às{' '}
                        <span className="font-semibold text-slate-900">{business.closeTime}</span>
                    </div>
                    <Button type="submit" disabled={isSaving || !isDirty} className="min-h-12 lg:min-h-0 sm:w-auto">
                        {isSaving ? 'Salvando...' : 'Salvar horários'}
                    </Button>
                </div>
            </form>
        </Card>
    )
}
