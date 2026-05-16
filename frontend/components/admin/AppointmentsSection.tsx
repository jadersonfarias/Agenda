'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    type AdminAppointmentItem,
    type AdminAppointmentStatus,
    type AdminAppointmentStatusFilter,
} from '../../features/admin/types'
import {
    getAdminAppointmentsQueryBusinessKey,
    useAdminAppointmentsQuery,
} from '../../features/admin/hooks/use-admin-appointments-query'
import { updateAdminAppointmentStatus } from '../../features/admin/services/admin-api.service'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Label } from '../ui/label'
import { Select } from '../ui/select'

const appointmentStatusLabels: Record<AdminAppointmentStatus, string> = {
    SCHEDULED: 'Agendado',
    COMPLETED: 'Concluído',
    CANCELED: 'Cancelado',
}

const appointmentStatusBadgeStyles: Record<AdminAppointmentStatus, string> = {
    SCHEDULED: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELED: 'bg-red-100 text-red-700',
}

const appointmentFilterOptions: { value: AdminAppointmentStatusFilter; label: string }[] = [
    { value: 'scheduled', label: 'Agendados' },
    { value: 'completed', label: 'Concluídos' },
    { value: 'canceled', label: 'Cancelados' },
    { value: 'all', label: 'Todos' },
]

type AppointmentsSectionProps = {
    businessId: string
    enabled: boolean
    appointmentFilter: AdminAppointmentStatusFilter
    onAppointmentFilterChange: (value: AdminAppointmentStatusFilter) => void
    initialAppointments?: AdminAppointmentItem[]
    onAppointmentStatusSaved?: (input: {
        previousStatus: AdminAppointmentStatus
        nextStatus: AdminAppointmentStatus
    }) => void
}

export function AppointmentsSection({
    businessId,
    enabled,
    appointmentFilter,
    onAppointmentFilterChange,
    initialAppointments,
    onAppointmentStatusSaved,
}: AppointmentsSectionProps) {
    const queryClient = useQueryClient()
    const [appointmentStatusDrafts, setAppointmentStatusDrafts] = useState<Record<string, AdminAppointmentStatus>>({})
    const appointmentsQuery = useAdminAppointmentsQuery(
        businessId,
        appointmentFilter,
        enabled,
        appointmentFilter === 'scheduled' ? initialAppointments : undefined
    )

    useEffect(() => {
        setAppointmentStatusDrafts({})
    }, [appointmentFilter, businessId])

    const updateAppointmentStatusMutation = useMutation({
        mutationFn: updateAdminAppointmentStatus,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: getAdminAppointmentsQueryBusinessKey(businessId) }),
                queryClient.invalidateQueries({ queryKey: ['admin-monthly-summary', businessId] }),
            ])
            toast.success('Status do agendamento atualizado com sucesso')
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : 'Erro ao atualizar status do agendamento'

            toast.error(message || 'Erro ao atualizar status do agendamento')
        },
    })

    const handleAppointmentStatusChange = (appointmentId: string, status: AdminAppointmentStatus) => {
        setAppointmentStatusDrafts((current) => ({
            ...current,
            [appointmentId]: status,
        }))
    }

    const handleAppointmentStatusSave = async (appointmentId: string, status: AdminAppointmentStatus, originalStatus: AdminAppointmentStatus) => {
        const nextStatus = appointmentStatusDrafts[appointmentId] ?? status

        if (nextStatus === originalStatus) {
            return
        }

        try {
            await updateAppointmentStatusMutation.mutateAsync({
                appointmentId,
                businessId,
                status: nextStatus,
            })

            onAppointmentStatusSaved?.({
                previousStatus: originalStatus,
                nextStatus,
            })

            setAppointmentStatusDrafts((current) => {
                const nextDrafts = { ...current }
                delete nextDrafts[appointmentId]
                return nextDrafts
            })
        } catch {
            return
        }
    }

    return (
        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
            <div className="mb-4 flex flex-col gap-3 sm:mb-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Agenda</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Agendamentos</h2>
                    <p className="mt-2 max-w-2xl text-xs text-slate-600 sm:text-sm">
                        Atualize o status de cada agendamento sem alterar as demais funcionalidades do sistema.
                    </p>
                </div>
                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto">
                    {appointmentFilterOptions.map((option) => (
                        <Button
                            key={option.value}
                            variant={appointmentFilter === option.value ? 'default' : 'secondary'}
                            type="button"
                            onClick={() => onAppointmentFilterChange(option.value)}
                            className="min-h-12 rounded-full px-4 py-2 text-sm font-semibold lg:min-h-0"
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
                {appointmentsQuery.isLoading ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-xs text-slate-500 sm:text-sm">
                        Carregando agendamentos...
                    </div>
                ) : null}

                {appointmentsQuery.isError ? (
                    <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-xs text-red-600 sm:text-sm">
                        Não foi possível carregar os agendamentos.
                    </div>
                ) : null}

                {!appointmentsQuery.isLoading && !appointmentsQuery.isError && (appointmentsQuery.data?.length ?? 0) === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-xs text-slate-500 sm:text-sm">
                        Nenhum agendamento nesta categoria.
                    </div>
                ) : null}

                {!appointmentsQuery.isLoading && !appointmentsQuery.isError
                    ? appointmentsQuery.data?.map((appointment) => {
                          const selectedStatus = appointmentStatusDrafts[appointment.id] ?? appointment.status
                          const isSaving =
                              updateAppointmentStatusMutation.isPending &&
                              updateAppointmentStatusMutation.variables?.appointmentId === appointment.id
                          const hasStatusChanged = selectedStatus !== appointment.status

                          return (
                              <div
                                  key={appointment.id}
                                  className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center lg:gap-6"
                              >
                                  <div className="min-w-0 space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{appointment.customer.name}</h3>
                                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[.2em] ${appointmentStatusBadgeStyles[appointment.status]}`}>
                                              {appointmentStatusLabels[appointment.status]}
                                          </span>
                                      </div>
                                      <p className="text-sm text-slate-600">{appointment.customer.phone}</p>
                                      <p className="text-sm text-slate-500">{appointment.service.name}</p>
                                      <p className="text-sm text-slate-500">
                                          {new Date(appointment.scheduledAt).toLocaleString('pt-BR', {
                                              dateStyle: 'short',
                                              timeStyle: 'short',
                                          })}
                                      </p>
                                  </div>

                                  <div className="flex w-full flex-col gap-3 lg:w-full">
                                      <Label className="w-full space-y-2">
                                          <span>Status</span>
                                          <Select
                                              value={selectedStatus}
                                              onChange={(event) =>
                                                  handleAppointmentStatusChange(
                                                      appointment.id,
                                                      event.target.value as AdminAppointmentStatus
                                                  )
                                              }
                                              disabled={isSaving}
                                          >
                                              <option value="SCHEDULED">Agendado</option>
                                              <option value="COMPLETED">Concluído</option>
                                              <option value="CANCELED">Cancelado</option>
                                          </Select>
                                      </Label>

                                      <Button
                                          type="button"
                                          onClick={() => handleAppointmentStatusSave(appointment.id, selectedStatus, appointment.status)}
                                          disabled={isSaving || !hasStatusChanged}
                                          className="min-h-12 lg:min-h-0 lg:w-full"
                                      >
                                          {isSaving ? 'Salvando...' : 'Salvar status'}
                                      </Button>
                                  </div>
                              </div>
                          )
                      })
                    : null}
            </div>
        </Card>
    )
}
