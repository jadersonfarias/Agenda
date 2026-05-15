'use client'

import Link from 'next/link'
import { useMutation, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
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
        return 'bg-purple-100 text-purple-700'
    }

    if (status === 'COMPLETED') {
        return 'bg-emerald-100 text-emerald-700'
    }

    return 'bg-slate-200 text-slate-700'
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
                <Card className="border-slate-200 bg-white shadow-sm shadow-slate-100">
                    <div className="space-y-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[.2em] text-slate-400">Serviço</p>
                                <h2 className="mt-1 break-words text-[1.35rem] font-semibold text-slate-900 sm:text-2xl">{appointment.service}</h2>
                            </div>

                            <span className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(appointment.status)}`}>
                                {getStatusLabel(appointment.status)}
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs uppercase tracking-[.18em] text-slate-400">Cliente</p>
                                <p className="mt-1 text-base font-semibold text-slate-900">{appointment.customerName}</p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs uppercase tracking-[.18em] text-slate-400">Valor</p>
                                <p className="mt-1 text-base font-semibold text-slate-900">R$ {appointment.price}</p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs uppercase tracking-[.18em] text-slate-400">Data</p>
                                <p className="mt-1 text-base font-semibold text-slate-900">
                                    {format(new Date(appointment.scheduledAt), 'dd/MM/yyyy')}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs uppercase tracking-[.18em] text-slate-400">Horário</p>
                                <p className="mt-1 text-base font-semibold text-purple-700">
                                    {format(new Date(appointment.scheduledAt), 'HH:mm')}
                                </p>
                            </div>
                        </div>

                        {appointment.canCancel ? (
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => cancelMutation.mutate()}
                                    disabled={cancelMutation.status === 'pending'}
                                    className="sm:w-auto"
                                >
                                    {cancelMutation.status === 'pending' ? 'Cancelando...' : 'Cancelar agendamento'}
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">
                                Este agendamento não pode mais ser cancelado.
                            </p>
                        )}
                    </div>
                </Card>
            ) : null}
        </main>
    )
}
