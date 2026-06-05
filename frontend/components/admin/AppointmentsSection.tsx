'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    type AdminAppointmentItem,
    type AdminAppointmentStatus,
    type AdminAppointmentStatusFilter,
    type AdminMembershipItem,
} from '../../features/admin/types'
import {
    getAdminAppointmentsQueryBusinessKey,
    useAdminAppointmentsQuery,
} from '../../features/admin/hooks/use-admin-appointments-query'
import { adminRoleLabels } from '../../features/admin/role-labels'
import {
    updateAdminAppointmentAssignee,
    updateAdminAppointmentStatus,
} from '../../features/admin/services/admin-api.service'
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
    { value: 'all', label: 'Todos' },
    { value: 'scheduled', label: 'Agendados' },
    { value: 'completed', label: 'Concluídos' },
    { value: 'canceled', label: 'Cancelados' },
]

type CompactFilterOption = {
    value: string
    label: string
}

type AppointmentsSectionProps = {
    businessId: string
    enabled: boolean
    appointmentFilter: AdminAppointmentStatusFilter
    onAppointmentFilterChange: (value: AdminAppointmentStatusFilter) => void
    assignedToUserIdFilter?: string
    onAssignedToUserIdFilterChange?: (value: string) => void
    canManageAppointmentAssignee?: boolean
    assignableMembers?: AdminMembershipItem[]
    initialAppointments?: AdminAppointmentItem[]
    onAppointmentStatusSaved?: (input: {
        previousStatus: AdminAppointmentStatus
        nextStatus: AdminAppointmentStatus
    }) => void
}

type CompactFilterDropdownProps = {
    label: string
    options: CompactFilterOption[]
    value: string
    onChange: (value: string) => void
}

function CompactFilterDropdown({ label, options, value, onChange }: CompactFilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const selectedOption = options.find((option) => option.value === value) ?? options[0]

    useEffect(() => {
        if (!isOpen) {
            return
        }

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            if (!containerRef.current) {
                return
            }

            const target = event.target

            if (target instanceof Node && !containerRef.current.contains(target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('touchstart', handlePointerDown)

        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('touchstart', handlePointerDown)
        }
    }, [isOpen])

    return (
        <div ref={containerRef} className="relative">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[.18em] text-slate-500">
                {label}
            </span>

            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((current) => !current)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        setIsOpen(false)
                    }
                }}
                className={[
                    'relative flex min-h-11 w-full items-center rounded-2xl border bg-white px-4 py-2.5 pr-12 text-left text-sm font-semibold text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-purple-200',
                    isOpen
                        ? 'border-purple-300 shadow-purple-100/80'
                        : 'border-slate-200 hover:border-purple-200 hover:bg-purple-50/40',
                ].join(' ')}
            >
                <span className="min-w-0 truncate">{selectedOption?.label ?? ''}</span>
                <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className={[
                        'pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-transform duration-200',
                        isOpen ? 'rotate-180' : 'rotate-0',
                    ].join(' ')}
                    fill="none"
                >
                    <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {isOpen ? (
                <div
                    role="listbox"
                    aria-label={label}
                    className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-purple-100 bg-white p-1.5 shadow-xl shadow-slate-200/80"
                >
                    {options.map((option) => {
                        const isSelected = option.value === value

                        return (
                            <button
                                key={`${label}-${option.value}`}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                    onChange(option.value)
                                    setIsOpen(false)
                                }}
                                className={[
                                    'flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium transition',
                                    isSelected
                                        ? 'bg-purple-50 text-purple-700'
                                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950',
                                ].join(' ')}
                            >
                                {option.label}
                            </button>
                        )
                    })}
                </div>
            ) : null}
        </div>
    )
}

export function AppointmentsSection({
    businessId,
    enabled,
    appointmentFilter,
    onAppointmentFilterChange,
    assignedToUserIdFilter = 'all',
    onAssignedToUserIdFilterChange,
    canManageAppointmentAssignee = false,
    assignableMembers = [],
    initialAppointments,
    onAppointmentStatusSaved,
}: AppointmentsSectionProps) {
    const queryClient = useQueryClient()
    const [appointmentStatusDrafts, setAppointmentStatusDrafts] = useState<Record<string, AdminAppointmentStatus>>({})
    const [appointmentAssigneeDrafts, setAppointmentAssigneeDrafts] = useState<Record<string, string>>({})
    const appointmentStatusFilterOptions = appointmentFilterOptions as CompactFilterOption[]
    const assigneeFilterOptions: CompactFilterOption[] = [
        { value: 'all', label: 'Todos os responsáveis' },
        ...assignableMembers.map((membership) => ({
            value: membership.user.id,
            label: `${membership.user.name} (${adminRoleLabels[membership.role]})`,
        })),
    ]
    const normalizedAssignedToUserIdFilter =
        canManageAppointmentAssignee && assignedToUserIdFilter !== 'all' ? assignedToUserIdFilter : undefined
    const appointmentsQuery = useAdminAppointmentsQuery(
        businessId,
        appointmentFilter,
        enabled,
        appointmentFilter === 'scheduled' && !normalizedAssignedToUserIdFilter ? initialAppointments : undefined,
        normalizedAssignedToUserIdFilter
    )

    useEffect(() => {
        setAppointmentStatusDrafts({})
        setAppointmentAssigneeDrafts({})
    }, [appointmentFilter, businessId, normalizedAssignedToUserIdFilter])

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

    const updateAppointmentAssigneeMutation = useMutation({
        mutationFn: updateAdminAppointmentAssignee,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: getAdminAppointmentsQueryBusinessKey(businessId) })
            toast.success('Responsável do agendamento atualizado com sucesso')
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : 'Erro ao atualizar responsável do agendamento'

            toast.error(message || 'Erro ao atualizar responsável do agendamento')
        },
    })

    const handleAppointmentStatusChange = (appointmentId: string, status: AdminAppointmentStatus) => {
        setAppointmentStatusDrafts((current) => ({
            ...current,
            [appointmentId]: status,
        }))
    }

    const handleAppointmentAssigneeChange = (appointmentId: string, assignedToUserId: string) => {
        setAppointmentAssigneeDrafts((current) => ({
            ...current,
            [appointmentId]: assignedToUserId,
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

    const handleAppointmentAssigneeSave = async (
        appointmentId: string,
        selectedAssigneeId: string,
        originalAssigneeId: string | null
    ) => {
        const nextAssignedToUserId = selectedAssigneeId === 'unassigned' ? null : selectedAssigneeId

        if (nextAssignedToUserId === originalAssigneeId) {
            return
        }

        try {
            await updateAppointmentAssigneeMutation.mutateAsync({
                appointmentId,
                businessId,
                assignedToUserId: nextAssignedToUserId,
            })

            setAppointmentAssigneeDrafts((current) => {
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
                <div className="hidden w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                    {appointmentFilterOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onAppointmentFilterChange(option.value)}
                            className={
                                appointmentFilter === option.value
                                    ? 'inline-flex min-h-10 items-center justify-center rounded-2xl border border-purple-700 bg-purple-700 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition focus:outline-none focus:ring-2 focus:ring-purple-200 sm:min-w-[120px]'
                                    : 'inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:min-w-[120px]'
                            }
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50/90 p-3 shadow-sm shadow-slate-100 sm:hidden">
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[.22em] text-slate-500">Filtros</p>
                    <CompactFilterDropdown
                        label="Status"
                        options={appointmentStatusFilterOptions}
                        value={appointmentFilter}
                        onChange={(value) => onAppointmentFilterChange(value as AdminAppointmentStatusFilter)}
                    />
                    {canManageAppointmentAssignee && onAssignedToUserIdFilterChange ? (
                        <CompactFilterDropdown
                            label="Responsável"
                            options={assigneeFilterOptions}
                            value={assignedToUserIdFilter}
                            onChange={onAssignedToUserIdFilterChange}
                        />
                    ) : null}
                </div>
            </div>

            {canManageAppointmentAssignee && onAssignedToUserIdFilterChange ? (
                <div className="mb-4 hidden rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:mb-6 sm:block sm:p-4">
                    <div className="max-w-sm">
                        <CompactFilterDropdown
                            label="Filtrar por responsável"
                            options={assigneeFilterOptions}
                            value={assignedToUserIdFilter}
                            onChange={onAssignedToUserIdFilterChange}
                        />
                    </div>
                </div>
            ) : null}

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
                          const selectedAssignee =
                              appointmentAssigneeDrafts[appointment.id] ??
                              appointment.assignedToUserId ??
                              'unassigned'
                          const isSavingAssignee =
                              updateAppointmentAssigneeMutation.isPending &&
                              updateAppointmentAssigneeMutation.variables?.appointmentId === appointment.id
                          const hasStatusChanged = selectedStatus !== appointment.status
                          const hasAssigneeChanged =
                              (selectedAssignee === 'unassigned' ? null : selectedAssignee) !== appointment.assignedToUserId

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
                                          Responsável pelo atendimento:{' '}
                                          <span className="font-medium text-slate-700">
                                              {appointment.assignedToUser?.name ?? 'Sem responsável'}
                                          </span>
                                      </p>
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

                                      {canManageAppointmentAssignee ? (
                                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                              <Label className="w-full space-y-2">
                                                  <span>Responsável pelo atendimento</span>
                                                  <Select
                                                      value={selectedAssignee}
                                                      onChange={(event) =>
                                                          handleAppointmentAssigneeChange(
                                                              appointment.id,
                                                              event.target.value
                                                          )
                                                      }
                                                      disabled={isSavingAssignee}
                                                  >
                                                      <option value="unassigned">Sem responsável</option>
                                                      {assignableMembers.map((membership) => (
                                                          <option key={membership.user.id} value={membership.user.id}>
                                                              {membership.user.name} ({adminRoleLabels[membership.role]})
                                                          </option>
                                                      ))}
                                                  </Select>
                                              </Label>

                                              <Button
                                                  type="button"
                                                  variant="secondary"
                                                  onClick={() =>
                                                      handleAppointmentAssigneeSave(
                                                          appointment.id,
                                                          selectedAssignee,
                                                          appointment.assignedToUserId
                                                      )
                                                  }
                                                  disabled={isSavingAssignee || !hasAssigneeChanged}
                                                  className="mt-3 min-h-12 lg:min-h-0 lg:w-full"
                                              >
                                                  {isSavingAssignee ? 'Salvando...' : 'Salvar responsável'}
                                              </Button>
                                          </div>
                                      ) : null}
                                  </div>
                              </div>
                          )
                      })
                    : null}
            </div>
        </Card>
    )
}
