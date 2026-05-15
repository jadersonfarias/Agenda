'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { availabilityFormSchema, type AvailabilityFormValues } from '../../features/admin/schemas'
import { type AdminDashboardData } from '../../features/admin/types'
import { updateAdminAvailability } from '../../features/admin/services/admin-api.service'
import { notify } from '../../lib/toast'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

type AvailabilitySectionProps = {
    business: AdminDashboardData['business']
    onSaved: (business: AdminDashboardData['business']) => void
}

export function AvailabilitySection({ business, onSaved }: AvailabilitySectionProps) {
    const [isSaving, setIsSaving] = useState(false)
    const {
        register,
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

            <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
                <Label className="space-y-2">
                    <span className="text-sm font-medium sm:text-base">Abertura</span>
                    <Input type="time" {...register('openTime')} />
                    {errors.openTime ? <p className="text-xs text-red-600 sm:text-sm">{errors.openTime.message}</p> : null}
                </Label>

                <Label className="space-y-2">
                    <span className="text-sm font-medium sm:text-base">Encerramento</span>
                    <Input type="time" {...register('closeTime')} />
                    {errors.closeTime ? <p className="text-xs text-red-600 sm:text-sm">{errors.closeTime.message}</p> : null}
                </Label>

                <div className="sm:col-span-2 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
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
