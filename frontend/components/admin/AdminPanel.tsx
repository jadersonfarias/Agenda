'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { signOut, useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { availabilityFormSchema, serviceFormSchema, type AvailabilityFormValues, type ServiceFormValues } from '../../features/admin/schemas'
import { type AdminAppointmentItem, type AdminAppointmentStatus, type AdminAppointmentStatusFilter, type AdminDashboardData, type AdminServiceItem } from '../../features/admin/types'
import { useAdminAppointmentsQuery } from '../../features/admin/hooks/use-admin-appointments-query'
import { useAdminMonthlySummaryQuery } from '../../features/admin/hooks/use-admin-monthly-summary-query'
import { updateAdminAppointmentStatus } from '../../features/admin/services/admin-api.service'
import { useAdminServicesQuery } from '../../features/admin/hooks/use-admin-services-query'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Modal } from '../ui/modal'
import { Select } from '../ui/select'
import { notify } from '../../lib/toast'

type AdminPanelProps = {
    initialData: AdminDashboardData
}

type ServiceFormMode = 'create' | 'edit'

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
    { value: 'active', label: 'Agenda' },
    { value: 'completed', label: 'Histórico' },
    { value: 'all', label: 'Todos' },
]

function getCurrentMonthValue() {
    const currentDate = new Date()
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
}

async function parseApiResponse(response: Response) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null

    if (!response.ok) {
        throw new Error(payload?.message || 'Não foi possível concluir a operação')
    }

    return payload
}

function AvailabilityForm({
    business,
    onSaved,
}: {
    business: AdminDashboardData['business']
    onSaved: (value: AdminDashboardData['business']) => void
}) {
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
            const response = await fetch('/api/admin/availability', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })
            const data = (await parseApiResponse(response)) as AdminDashboardData['business']
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
                    Defina a faixa horária usada na agenda pública para calcular os horários livres do negócio.
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
                    <Button type="submit" disabled={isSaving || !isDirty} className="sm:w-auto">
                        {isSaving ? 'Salvando...' : 'Salvar horários'}
                    </Button>
                </div>
            </form>
        </Card>
    )
}

function ServiceForm({
    mode,
    initialValues,
    onCancel,
    onSaved,
}: {
    mode: ServiceFormMode
    initialValues?: AdminServiceItem | null
    onCancel: () => void
    onSaved: (value: AdminServiceItem, mode: ServiceFormMode) => void
}) {
    const [isSaving, setIsSaving] = useState(false)
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceFormSchema),
        defaultValues: initialValues
            ? {
                name: initialValues.name,
                price: Number(initialValues.price),
                durationMinutes: initialValues.durationMinutes,
            }
            : {
                name: '',
                price: 0,
                durationMinutes: 30,
            },
    })

    const onSubmit = handleSubmit(async (values) => {
        setIsSaving(true)

        try {
            const response = await fetch(
                mode === 'create' ? '/api/admin/services' : `/api/admin/services/${initialValues?.id}`,
                {
                    method: mode === 'create' ? 'POST' : 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(values),
                }
            )
            const data = (await parseApiResponse(response)) as AdminServiceItem
            onSaved(data, mode)
            toast.success(mode === 'create' ? 'Serviço criado com sucesso' : 'Serviço atualizado com sucesso')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar serviço')
        } finally {
            setIsSaving(false)
        }
    })

    return (
        <form className="grid gap-4" onSubmit={onSubmit}>
            <Label className="space-y-2">
                <span className="text-sm font-medium sm:text-base">Nome do serviço</span>
                <Input placeholder="Ex: Corte feminino" {...register('name')} />
                {errors.name ? <p className="text-xs text-red-600 sm:text-sm">{errors.name.message}</p> : null}
            </Label>

            <div className="grid gap-4 sm:grid-cols-2">
                <Label className="space-y-2">
                    <span className="text-sm font-medium sm:text-base">Preço</span>
                    <Input type="number" step="0.01" min="0" {...register('price', { valueAsNumber: true })} />
                    {errors.price ? <p className="text-xs text-red-600 sm:text-sm">{errors.price.message}</p> : null}
                </Label>

                <Label className="space-y-2">
                    <span className="text-sm font-medium sm:text-base">Duração (min)</span>
                    <Input type="number" min="5" step="5" {...register('durationMinutes', { valueAsNumber: true })} />
                    {errors.durationMinutes ? <p className="text-xs text-red-600 sm:text-sm">{errors.durationMinutes.message}</p> : null}
                </Label>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSaving} className="sm:w-auto">
                    {isSaving ? 'Salvando...' : mode === 'create' ? 'Criar serviço' : 'Salvar alterações'}
                </Button>
            </div>
        </form>
    )
}

export default function AdminPanel({ initialData }: AdminPanelProps) {
    const { data: session } = useSession()
    const queryClient = useQueryClient()
    const [business, setBusiness] = useState(initialData.business)
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingService, setEditingService] = useState<AdminServiceItem | null>(null)
    const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null)
    const [appointmentStatusDrafts, setAppointmentStatusDrafts] = useState<Record<string, AdminAppointmentStatus>>({})
    const [appointmentFilter, setAppointmentFilter] = useState<AdminAppointmentStatusFilter>('active')
    const servicesQuery = useAdminServicesQuery(session?.accessToken)
    const appointmentsQuery = useAdminAppointmentsQuery(business.id, appointmentFilter, Boolean(session?.accessToken))
    const monthlySummaryQuery = useAdminMonthlySummaryQuery(selectedMonth, Boolean(session?.accessToken))
    const services = servicesQuery.data ?? initialData.services

    const updateAppointmentStatusMutation = useMutation({
        mutationFn: updateAdminAppointmentStatus,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['admin-appointments', business.id] }),
                queryClient.invalidateQueries({ queryKey: ['admin-monthly-summary'] }),
            ])
            toast.success('Status do agendamento atualizado com sucesso')
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : 'Erro ao atualizar status do agendamento'

            toast.error(message || 'Erro ao atualizar status do agendamento')
        },
    })

    const handleServiceSaved = async (_service: AdminServiceItem, _mode: ServiceFormMode) => {
        await queryClient.invalidateQueries({ queryKey: ['admin-services'] })
        setIsCreateOpen(false)
        setEditingService(null)
    }

    const handleDeleteService = async (serviceId: string) => {
        setDeletingServiceId(serviceId)

        try {
            const response = await fetch(`/api/admin/services/${serviceId}`, {
                method: 'DELETE',
            })
            await parseApiResponse(response)
            await queryClient.invalidateQueries({ queryKey: ['admin-services'] })
            toast.success('Serviço removido com sucesso')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao remover serviço')
        } finally {
            setDeletingServiceId(null)
        }
    }

    const handleAppointmentStatusChange = (appointmentId: string, status: AdminAppointmentStatus) => {
        setAppointmentStatusDrafts((current) => ({
            ...current,
            [appointmentId]: status,
        }))
    }

    const handleAppointmentStatusSave = async (appointment: AdminAppointmentItem) => {
        const nextStatus = appointmentStatusDrafts[appointment.id] ?? appointment.status

        try {
            await updateAppointmentStatusMutation.mutateAsync({
                appointmentId: appointment.id,
                businessId: business.id,
                status: nextStatus,
            })

            setAppointmentStatusDrafts((current) => {
                const nextDrafts = { ...current }
                delete nextDrafts[appointment.id]
                return nextDrafts
            })
        } catch {
            return
        }
    }

    return (
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10 lg:px-8">
            <Card className="border-purple-200 bg-gradient-to-br from-white via-white to-purple-50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2 sm:space-y-3">
                        <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Painel admin</p>
                        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl lg:text-4xl">Gestão do salão</h1>
                        <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
                            Ajuste a vitrine de serviços e a janela de atendimento do negócio <span className="font-semibold">{business.name}</span>.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm text-slate-600">
                            <div className="font-medium text-slate-900">{business.slug}</div>
                            <div>{session?.user?.email ?? 'Sessão ativa'}</div>
                        </div>
                        <Button variant="secondary" type="button" onClick={() => signOut({ callbackUrl: '/login' })} className="sm:w-auto">
                            Sair
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                    <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Serviços</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{services.length}</p>
                    <p className="mt-2 text-xs text-slate-600 sm:text-sm">Itens ativos na agenda do salão.</p>
                </Card>
                <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                    <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Funcionamento</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900 sm:text-3xl">
                        {business.openTime} - {business.closeTime}
                    </p>
                    <p className="mt-2 text-xs text-slate-600 sm:text-sm">Faixa horária usada para calcular disponibilidade.</p>
                </Card>
                <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                    <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Reserva pública</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">/</p>
                    <p className="mt-2 text-xs text-slate-600 sm:text-sm">Mudanças aqui refletem na página de agendamento.</p>
                </Card>
                <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                    <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Agendamentos</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{appointmentsQuery.data?.length ?? 0}</p>
                    <p className="mt-2 text-xs text-slate-600 sm:text-sm">Total de agendamentos registrados.</p>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Financeiro</p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Caixa mensal</h2>
                        <p className="mt-2 max-w-2xl text-xs text-slate-600 sm:text-sm">
                            Resumo simples do mês com base em agendamentos concluídos e atividade recente dos clientes.
                        </p>
                    </div>

                    <Label className="space-y-2">
                        <span className="text-xs text-slate-600 sm:text-sm">Mês de referência</span>
                        <Input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
                    </Label>
                </div>

                {monthlySummaryQuery.isLoading ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-xs text-slate-500 sm:text-sm">
                        Carregando resumo financeiro...
                    </div>
                ) : monthlySummaryQuery.isError ? (
                    <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-xs text-red-600 sm:text-sm">
                        Não foi possível carregar o resumo financeiro.
                    </div>
                ) : monthlySummaryQuery.data ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-slate-200 bg-slate-50 shadow-none">
                            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Faturamento</p>
                            <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">R$ {monthlySummaryQuery.data.totalRevenue}</p>
                            <p className="mt-2 text-xs text-slate-600 sm:text-sm">Somente agendamentos concluídos no mês.</p>
                        </Card>
                        <Card className="border-slate-200 bg-slate-50 shadow-none">
                            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Concluídos</p>
                            <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{monthlySummaryQuery.data.completedAppointments}</p>
                            <p className="mt-2 text-xs text-slate-600 sm:text-sm">Atendimentos com status `COMPLETED`.</p>
                        </Card>
                        <Card className="border-slate-200 bg-slate-50 shadow-none">
                            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Ticket médio</p>
                            <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">R$ {monthlySummaryQuery.data.averageTicket}</p>
                            <p className="mt-2 text-xs text-slate-600 sm:text-sm">Valor médio por atendimento concluído.</p>
                        </Card>
                        <Card className="border-slate-200 bg-slate-50 shadow-none">
                            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Clientes</p>
                            <p className="mt-3 text-lg font-semibold text-slate-900 sm:text-xl">
                                {monthlySummaryQuery.data.activeCustomers} ativos / {monthlySummaryQuery.data.inactiveCustomers} inativos
                            </p>
                            <p className="mt-2 text-xs text-slate-600 sm:text-sm">
                                Ativo = atendimento concluído nos últimos {monthlySummaryQuery.data.activeCustomerWindowDays} dias.
                            </p>
                        </Card>
                    </div>
                ) : null}
            </Card>

            <AvailabilityForm
                business={business}
                onSaved={(updatedBusiness) => {
                    setBusiness(updatedBusiness)
                }}
            />

            <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Agenda</p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Agendamentos</h2>
                        <p className="mt-2 max-w-2xl text-xs text-slate-600 sm:text-sm">
                            Atualize o status de cada agendamento sem alterar as demais funcionalidades do sistema.
                        </p>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
                        {appointmentFilterOptions.map((option) => (
                            <Button
                                key={option.value}
                                variant={appointmentFilter === option.value ? 'default' : 'secondary'}
                                type="button"
                                onClick={() => setAppointmentFilter(option.value)}
                                className="rounded-full px-4 py-2 text-sm font-semibold"
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
                            const isSaving = updateAppointmentStatusMutation.isPending && updateAppointmentStatusMutation.variables?.appointmentId === appointment.id
                            const hasStatusChanged = selectedStatus !== appointment.status

                            return (
                                <div
                                    key={appointment.id}
                                    className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between"
                                >
                                    <div className="space-y-1">
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

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                        <Label className="space-y-2">
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
                                            onClick={() => handleAppointmentStatusSave(appointment)}
                                            disabled={isSaving || !hasStatusChanged}
                                            className="sm:w-auto"
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

            <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                <div className="mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Catálogo</p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Serviços cadastrados</h2>
                        <p className="mt-2 max-w-2xl text-xs text-slate-600 sm:text-sm">
                            Crie, edite ou remova serviços. Serviços com agendamentos vinculados ficam protegidos contra exclusão.
                        </p>
                    </div>

                    <Button type="button" onClick={() => setIsCreateOpen(true)} className="sm:w-auto">
                        Novo serviço
                    </Button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {servicesQuery.isLoading ? (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-xs text-slate-500 sm:text-sm">
                            Carregando serviços...
                        </div>
                    ) : null}

                    {servicesQuery.isError ? (
                        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-600">
                            Não foi possível carregar os serviços.
                        </div>
                    ) : null}

                    {!servicesQuery.isLoading && !servicesQuery.isError && services.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                            Nenhum serviço cadastrado ainda. Crie o primeiro para começar a vender horários.
                        </div>
                    ) : null}

                    {!servicesQuery.isLoading && !servicesQuery.isError ? (
                        services.map((service) => (
                            <div
                                key={service.id}
                                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 md:flex-row md:items-center md:justify-between"
                            >
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{service.name}</h3>
                                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold uppercase tracking-[.2em] text-purple-700">
                                            {service.durationMinutes} min
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 sm:text-sm">R$ {Number(service.price).toFixed(2)}</p>
                                    <p className="text-xs text-slate-500 sm:text-sm">
                                        {service.appointmentCount === 0
                                            ? 'Sem agendamentos vinculados'
                                            : `${service.appointmentCount} agendamento(s) vinculado(s)`}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Button type="button" variant="secondary" onClick={() => setEditingService(service)} className="sm:w-auto">
                                        Editar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="danger"
                                        disabled={deletingServiceId === service.id || service.appointmentCount > 0}
                                        title={
                                            service.appointmentCount > 0
                                                ? 'Serviços com agendamentos vinculados não podem ser excluídos'
                                                : 'Excluir serviço'
                                        }
                                        onClick={() => handleDeleteService(service.id)}
                                        className="sm:w-auto"
                                    >
                                        {deletingServiceId === service.id ? 'Removendo...' : 'Excluir'}
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : null}
                </div>
            </Card>

            <Modal
                title="Novo serviço"
                description="Adicione um novo serviço ao catálogo do salão."
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            >
                <ServiceForm mode="create" onCancel={() => setIsCreateOpen(false)} onSaved={handleServiceSaved} />
            </Modal>

            <Modal
                title="Editar serviço"
                description="Atualize nome, preço e duração do serviço selecionado."
                open={Boolean(editingService)}
                onClose={() => setEditingService(null)}
            >
                <ServiceForm mode="edit" initialValues={editingService} onCancel={() => setEditingService(null)} onSaved={handleServiceSaved} />
            </Modal>
        </main>
    )
}
