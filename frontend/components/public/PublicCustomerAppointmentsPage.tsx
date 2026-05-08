'use client'

import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/backend'

const appointmentsLookupSchema = z.object({
    phone: z
        .string()
        .min(8, 'Informe um telefone válido')
        .transform((value) => value.trim()),
})

type AppointmentsLookupForm = z.infer<typeof appointmentsLookupSchema>

type CustomerAppointmentItem = {
    id: string
    publicToken: string
    serviceName: string
    scheduledAt: string
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELED'
    price: string
}

async function readJson<T>(response: Response): Promise<T | null> {
    return (await response.json().catch(() => null)) as T | null
}

function getStatusLabel(status: CustomerAppointmentItem['status']) {
    if (status === 'SCHEDULED') return 'Agendado'
    if (status === 'COMPLETED') return 'Concluído'
    return 'Cancelado'
}

function getStatusClasses(status: CustomerAppointmentItem['status']) {
    if (status === 'SCHEDULED') {
        return 'bg-purple-100 text-purple-700'
    }

    if (status === 'COMPLETED') {
        return 'bg-emerald-100 text-emerald-700'
    }

    return 'bg-slate-200 text-slate-700'
}

export function PublicCustomerAppointmentsPage() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AppointmentsLookupForm>({
        resolver: zodResolver(appointmentsLookupSchema),
        defaultValues: {
            phone: '',
        },
    })

    const searchMutation = useMutation({
        mutationFn: async ({ phone }: AppointmentsLookupForm) => {
            const searchParams = new URLSearchParams({ phone })
            const response = await fetch(`${apiBase}/appointments/customer?${searchParams.toString()}`, {
                cache: 'no-store',
            })

            if (!response.ok) {
                const payload = await readJson<{ message?: string }>(response)
                throw new Error(payload?.message || 'Não foi possível localizar seus agendamentos')
            }

            const payload = await readJson<CustomerAppointmentItem[]>(response)

            if (!payload || !Array.isArray(payload)) {
                throw new Error('Resposta inválida ao carregar os agendamentos')
            }

            return payload
        },
    })

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-5 overflow-x-hidden px-4 py-5 sm:gap-6 sm:px-6 sm:py-7 lg:px-8 lg:py-10">
            <Card className="border-purple-100 bg-white shadow-sm shadow-purple-100/40">
                <div className="space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-xs uppercase tracking-[.3em] text-violet-700 sm:text-sm">Consulta pública</p>
                        <h1 className="text-[1.75rem] font-semibold leading-tight text-slate-900 sm:text-3xl">
                            Meus agendamentos
                        </h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                            Informe o telefone usado na reserva para consultar seus próximos agendamentos.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit((data) => searchMutation.mutate(data))} className="space-y-4">
                        <Label className="space-y-2">
                            <span className="text-sm font-medium text-slate-900 sm:text-base">Telefone</span>
                            <Input
                                {...register('phone')}
                                placeholder="(11) 91234-5678"
                                className="w-full text-sm sm:text-base"
                            />
                            {errors.phone ? <p className="text-xs text-red-600 sm:text-sm">{errors.phone.message}</p> : null}
                        </Label>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button type="submit" className="w-full sm:w-auto" disabled={searchMutation.status === 'pending'}>
                                {searchMutation.status === 'pending' ? 'Buscando...' : 'Buscar agendamentos'}
                            </Button>

                            <Link
                                href="/"
                                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200 sm:w-auto sm:px-6 sm:text-sm"
                            >
                                Fazer nova reserva
                            </Link>
                        </div>
                    </form>
                </div>
            </Card>

            {searchMutation.isError ? (
                <Card className="border-red-200 bg-red-50 shadow-sm shadow-red-100/40">
                    <p className="text-sm font-medium text-red-700">
                        {searchMutation.error instanceof Error
                            ? searchMutation.error.message
                            : 'Não foi possível localizar seus agendamentos'}
                    </p>
                </Card>
            ) : null}

            {searchMutation.isSuccess && searchMutation.data.length === 0 ? (
                <Card className="border-slate-200 bg-white shadow-sm shadow-slate-100">
                    <p className="text-sm text-slate-600 sm:text-base">Nenhum agendamento encontrado.</p>
                </Card>
            ) : null}

            {searchMutation.isSuccess && searchMutation.data.length > 0 ? (
                <section className="space-y-4">
                    {searchMutation.data.map((appointment) => (
                        <Card key={appointment.id} className="border-slate-200 bg-white shadow-sm shadow-slate-100 sm:p-5 lg:p-6">
                            <div className="space-y-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-[.18em] text-slate-400">Serviço</p>
                                        <h2 className="mt-1 text-xl font-semibold text-slate-900">{appointment.serviceName}</h2>
                                    </div>

                                    <span className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(appointment.status)}`}>
                                        {getStatusLabel(appointment.status)}
                                    </span>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
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

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <p className="text-xs uppercase tracking-[.18em] text-slate-400">Valor</p>
                                        <p className="mt-1 text-base font-semibold text-slate-900">R$ {appointment.price}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                    <Link
                                        href={`/appointments/${appointment.publicToken}`}
                                        className="inline-flex w-full items-center justify-center rounded-2xl bg-purple-700 px-4 py-3 text-base font-semibold text-white transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:w-auto sm:px-6 sm:text-sm"
                                    >
                                        Ver detalhes
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </section>
            ) : null}
        </main>
    )
}
