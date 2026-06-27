'use client'

import Link from 'next/link'
import { useMutation, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    BadgeDollarSign,
    CalendarCheck2,
    CheckCircle2,
    Clock3,
    Scissors,
    UserRound,
    XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '../ui/card'
import { Button } from '../ui/button'

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/backend'

type PublicAppointmentPageProps = {
    token: string
}

type PublicAppointmentResponse = {
    token: string
    service: string
    customerName: string
    scheduledAt: string
    price: string
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELED'
    canCancel: boolean
}

async function readJson<T>(response: Response): Promise<T | null> {
    return (await response.json().catch(() => null)) as T | null
}

function getStatusLabel(status: PublicAppointmentResponse['status']) {
    if (status === 'SCHEDULED') return 'Agendado'
    if (status === 'COMPLETED') return 'Concluído'
    return 'Cancelado'
}

function getStatusClasses(status: PublicAppointmentResponse['status']) {
    if (status === 'SCHEDULED') {
        return 'border-purple-200 bg-purple-50 text-purple-700'
    }

    if (status === 'COMPLETED') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }

    return 'border-slate-200 bg-slate-100 text-slate-600'
}

function getStatusAccentClasses(status: PublicAppointmentResponse['status']) {
    if (status === 'SCHEDULED') return 'from-purple-600 via-violet-500 to-fuchsia-400'
    if (status === 'COMPLETED') return 'from-emerald-600 via-emerald-500 to-teal-400'
    return 'from-slate-500 via-slate-400 to-slate-300'
}

function AppointmentStatusBadge({ status }: { status: PublicAppointmentResponse['status'] }) {
    const StatusIcon =
        status === 'SCHEDULED'
            ? CalendarCheck2
            : status === 'COMPLETED'
              ? CheckCircle2
              : XCircle

    return (
        <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold sm:text-sm ${getStatusClasses(status)}`}
        >
            <StatusIcon className="h-4 w-4" aria-hidden="true" />
            {getStatusLabel(status)}
        </span>
    )
}

function formatPrice(price: string) {
    const numericPrice = Number(price)

    if (!Number.isFinite(numericPrice)) {
        return `R$ ${price}`
    }

    return numericPrice.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    })
}

function formatLongDate(scheduledAt: string) {
    const date = format(new Date(scheduledAt), "EEEE, dd 'de' MMMM", { locale: ptBR })
    return date.charAt(0).toUpperCase() + date.slice(1)
}

export function PublicAppointmentPage({ token }: PublicAppointmentPageProps) {
    const appointmentQuery = useQuery<PublicAppointmentResponse>({
        queryKey: ['public-appointment', token],
        queryFn: async () => {
            const response = await fetch(`${apiBase}/appointments/public/${token}`, {
                cache: 'no-store',
            })

            if (!response.ok) {
                const payload = await readJson<{ message?: string }>(response)
                throw new Error(payload?.message || 'Não foi possível carregar o agendamento')
            }

            const payload = await readJson<PublicAppointmentResponse>(response)

            if (!payload) {
                throw new Error('Resposta inválida ao carregar o agendamento')
            }

            return payload
        },
        retry: false,
    })

    const cancelMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${apiBase}/appointments/public/${token}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                const payload = await readJson<{ message?: string }>(response)
                throw new Error(payload?.message || 'Não foi possível cancelar o agendamento')
            }

            const payload = await readJson<PublicAppointmentResponse & { canceled: boolean }>(response)

            if (!payload) {
                throw new Error('Resposta inválida ao cancelar o agendamento')
            }

            return payload
        },
        onSuccess: async () => {
            toast.success('Agendamento cancelado com sucesso')
            await appointmentQuery.refetch()
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Não foi possível cancelar o agendamento')
        },
    })

    const appointment = appointmentQuery.data

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 overflow-x-hidden px-3 py-4 sm:gap-6 sm:px-6 sm:py-7 lg:px-8 lg:py-10">
            <Card className="border-purple-100 bg-white shadow-sm shadow-purple-100/40">
                <div className="space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-xs uppercase tracking-[.3em] text-violet-700 sm:text-sm">Consulta de agendamento</p>
                        <h1 className="text-[1.6rem] font-semibold leading-tight text-slate-900 sm:text-3xl">
                            Seu agendamento
                        </h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                            Veja os detalhes da sua reserva e cancele se ainda estiver dentro do prazo permitido.
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex text-sm font-medium text-purple-700 transition hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    >
                        Fazer nova reserva
                    </Link>
                </div>
            </Card>

            {appointmentQuery.isLoading ? (
                <Card className="border-slate-200 bg-white shadow-sm shadow-slate-100">
                    <p className="text-sm text-slate-600 sm:text-base">Carregando agendamento...</p>
                </Card>
            ) : appointmentQuery.isError ? (
                <Card className="border-red-200 bg-red-50 shadow-sm shadow-red-100/40">
                    <p className="text-sm font-medium text-red-700">
                        {appointmentQuery.error instanceof Error
                            ? appointmentQuery.error.message
                            : 'Não foi possível carregar o agendamento'}
                    </p>
                </Card>
            ) : appointment ? (
                <Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-xl shadow-slate-200/60 sm:p-0 lg:p-0">
                    <div className={`h-1.5 w-full bg-gradient-to-r ${getStatusAccentClasses(appointment.status)}`} />

                    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3.5">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 ring-1 ring-purple-100 sm:h-14 sm:w-14">
                                    <Scissors className="h-6 w-6" aria-hidden="true" />
                                </span>

                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-purple-700 sm:text-xs">
                                        Serviço reservado
                                    </p>
                                    <h2 className="mt-1 break-words text-xl font-semibold leading-tight text-slate-950 sm:text-2xl">
                                        {appointment.service}
                                    </h2>
                                </div>
                            </div>

                            <AppointmentStatusBadge status={appointment.status} />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,.85fr)]">
                            <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-fuchsia-50/60 p-4 sm:p-5">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-purple-700 shadow-sm ring-1 ring-purple-100">
                                        <CalendarCheck2 className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-[.18em] text-purple-700">
                                            Data da reserva
                                        </p>
                                        <p className="mt-1.5 text-lg font-semibold leading-snug text-slate-950 sm:text-xl">
                                            {formatLongDate(appointment.scheduledAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="my-4 h-px bg-purple-100" />

                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-700 text-white shadow-md shadow-purple-200">
                                        <Clock3 className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">Horário</p>
                                        <p className="text-2xl font-bold tracking-tight text-purple-700 sm:text-3xl">
                                            {format(new Date(appointment.scheduledAt), 'HH:mm')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70">
                                <div className="flex min-h-[5.5rem] items-center gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
                                        <UserRound className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-500">Cliente</p>
                                        <p className="mt-0.5 break-words text-base font-semibold text-slate-950">
                                            {appointment.customerName}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex min-h-[5.5rem] items-center gap-3 px-4 py-3.5 sm:px-5">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
                                        <BadgeDollarSign className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">Valor do serviço</p>
                                        <p className="mt-0.5 text-base font-semibold text-slate-950">
                                            {formatPrice(appointment.price)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {appointment.canCancel ? (
                            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Precisa cancelar?</p>
                                    <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-sm">
                                        Esta ação libera o horário para outra pessoa.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="danger"
                                    onClick={() => cancelMutation.mutate()}
                                    disabled={cancelMutation.status === 'pending'}
                                    className="min-h-11 shrink-0 rounded-xl px-5 py-2.5 text-sm sm:w-auto"
                                >
                                    {cancelMutation.status === 'pending' ? 'Cancelando...' : 'Cancelar agendamento'}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                                <CalendarCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Cancelamento indisponível</p>
                                    <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-sm">
                                        Este agendamento não pode mais ser cancelado.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            ) : null}
        </main>
    )
}
