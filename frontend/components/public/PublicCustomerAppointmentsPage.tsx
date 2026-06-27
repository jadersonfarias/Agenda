'use client'

import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    ArrowRight,
    BadgeDollarSign,
    CalendarCheck2,
    CheckCircle2,
    Clock3,
    Scissors,
    XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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

type PublicCustomerAppointmentsPageProps = {
    businessId?: string
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
        return 'border-purple-200 bg-purple-50 text-purple-700'
    }

    if (status === 'COMPLETED') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }

    return 'border-slate-200 bg-slate-100 text-slate-600'
}

function getStatusAccentClasses(status: CustomerAppointmentItem['status']) {
    if (status === 'SCHEDULED') return 'from-purple-600 via-violet-500 to-fuchsia-400'
    if (status === 'COMPLETED') return 'from-emerald-600 via-emerald-500 to-teal-400'
    return 'from-slate-500 via-slate-400 to-slate-300'
}

function AppointmentStatusBadge({ status }: { status: CustomerAppointmentItem['status'] }) {
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

const lastPublicBusinessIdStorageKey = 'marcacerta:lastPublicBusinessId'

export function PublicCustomerAppointmentsPage({ businessId }: PublicCustomerAppointmentsPageProps) {
    const [lookupBusinessId, setLookupBusinessId] = useState(businessId?.trim() || '')
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

    useEffect(() => {
        const trimmedBusinessId = businessId?.trim()

        if (trimmedBusinessId) {
            setLookupBusinessId(trimmedBusinessId)
            try {
                window.localStorage.setItem(lastPublicBusinessIdStorageKey, trimmedBusinessId)
            } catch {
                // Consulta continua funcionando pelo businessId da URL.
            }
            return
        }

        let storedBusinessId: string | null = null

        try {
            storedBusinessId = window.localStorage.getItem(lastPublicBusinessIdStorageKey)
        } catch {
            storedBusinessId = null
        }

        if (storedBusinessId) {
            setLookupBusinessId(storedBusinessId)
        }
    }, [businessId])

    const searchMutation = useMutation({
        mutationFn: async ({ phone }: AppointmentsLookupForm) => {
            const searchParams = new URLSearchParams({ phone })
            const trimmedBusinessId = lookupBusinessId.trim()

            if (trimmedBusinessId) {
                searchParams.set('businessId', trimmedBusinessId)
            }

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

    const hasAppointments = searchMutation.isSuccess && searchMutation.data.length > 0
    const hasEmptyState = searchMutation.isSuccess && searchMutation.data.length === 0
    const hasFeedbackCard = searchMutation.isError || hasEmptyState
    const shouldCenterLookupCard = !hasAppointments && !hasFeedbackCard

    return (
        <main className="mx-auto flex w-full max-w-4xl flex-col overflow-x-hidden px-4 sm:px-6 lg:px-8">
            <div
                className={`flex w-full flex-col gap-5 py-5 sm:gap-6 sm:py-7 lg:py-10 ${
                    shouldCenterLookupCard
                        ? 'min-h-[calc(100dvh-4.75rem)] justify-center sm:min-h-[calc(100dvh-5.25rem)] lg:min-h-[calc(100dvh-6rem)]'
                        : 'min-h-[calc(100dvh-4.75rem)] sm:min-h-[calc(100dvh-5.25rem)] lg:min-h-[calc(100dvh-6rem)]'
                }`}
            >
                <Card className="w-full self-center border-purple-100 bg-white shadow-sm shadow-purple-100/40 sm:max-w-2xl lg:max-w-3xl">
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
                    <Card className="w-full self-center border-red-200 bg-red-50 shadow-sm shadow-red-100/40 sm:max-w-2xl lg:max-w-3xl">
                        <p className="text-sm font-medium text-red-700">
                            {searchMutation.error instanceof Error
                                ? searchMutation.error.message
                                : 'Não foi possível localizar seus agendamentos'}
                        </p>
                    </Card>
                ) : null}

                {hasEmptyState ? (
                    <Card className="w-full self-center border-slate-200 bg-white shadow-sm shadow-slate-100 sm:max-w-2xl lg:max-w-3xl">
                        <p className="text-sm text-slate-600 sm:text-base">Nenhum agendamento encontrado.</p>
                    </Card>
                ) : null}

                {hasAppointments ? (
                    <section className="w-full self-center space-y-4 sm:max-w-2xl lg:max-w-3xl">
                        {searchMutation.data.map((appointment) => (
                            <Card
                                key={appointment.id}
                                className="overflow-hidden border-slate-200 bg-white p-0 shadow-lg shadow-slate-200/50 sm:p-0 lg:p-0"
                            >
                                <div className={`h-1 w-full bg-gradient-to-r ${getStatusAccentClasses(appointment.status)}`} />

                                <div className="space-y-4 p-4 sm:p-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                                                <Scissors className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-purple-700 sm:text-[11px]">
                                                    Serviço reservado
                                                </p>
                                                <h2 className="mt-1 break-words text-lg font-semibold leading-tight text-slate-950 sm:text-xl">
                                                    {appointment.serviceName}
                                                </h2>
                                            </div>
                                        </div>

                                        <AppointmentStatusBadge status={appointment.status} />
                                    </div>

                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 sm:grid sm:grid-cols-3">
                                        <div className="flex min-h-[4.75rem] items-center gap-3 border-b border-slate-200 px-3.5 py-3 sm:border-b-0 sm:border-r sm:px-4">
                                            <CalendarCheck2 className="h-5 w-5 shrink-0 text-purple-700" aria-hidden="true" />
                                            <div>
                                                <p className="text-[11px] font-medium text-slate-500">Data</p>
                                                <p className="mt-0.5 text-sm font-semibold capitalize text-slate-950 sm:text-base">
                                                    {format(new Date(appointment.scheduledAt), 'dd MMM yyyy', { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex min-h-[4.75rem] items-center gap-3 border-b border-slate-200 px-3.5 py-3 sm:border-b-0 sm:border-r sm:px-4">
                                            <Clock3 className="h-5 w-5 shrink-0 text-purple-700" aria-hidden="true" />
                                            <div>
                                                <p className="text-[11px] font-medium text-slate-500">Horário</p>
                                                <p className="mt-0.5 text-base font-bold text-purple-700 sm:text-lg">
                                                    {format(new Date(appointment.scheduledAt), 'HH:mm')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex min-h-[4.75rem] items-center gap-3 px-3.5 py-3 sm:px-4">
                                            <BadgeDollarSign className="h-5 w-5 shrink-0 text-purple-700" aria-hidden="true" />
                                            <div>
                                                <p className="text-[11px] font-medium text-slate-500">Valor</p>
                                                <p className="mt-0.5 text-sm font-semibold text-slate-950 sm:text-base">
                                                    {formatPrice(appointment.price)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs leading-5 text-slate-500 sm:text-sm">
                                            Consulte os dados completos ou cancele sua reserva.
                                        </p>
                                        <Link
                                            href={`/appointments/${appointment.publicToken}`}
                                            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:w-auto"
                                        >
                                            Ver detalhes
                                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </section>
                ) : null}

                <Card className="w-full self-center border-purple-100/80 bg-gradient-to-br from-white via-purple-50/60 to-purple-100/70 shadow-sm shadow-purple-100/50 sm:max-w-2xl lg:max-w-3xl">
                    <div className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-purple-700">
                            PARA NEGÓCIOS
                        </p>
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold leading-tight text-slate-900 sm:text-xl">
                                Também quer receber reservas online?
                            </h2>
                            <p className="text-sm leading-6 text-slate-600">
                                Com a MarcaCerta, você cria sua agenda, compartilha seu link e acompanha seus atendimentos em um só painel.
                            </p>
                        </div>
                        <div className="flex flex-col pt-1 sm:flex-row sm:justify-start">
                            <Link href="/signup" className="w-full sm:w-auto">
                                <Button className="w-full bg-purple-700 px-5 py-3 text-sm hover:bg-purple-800 sm:w-auto">
                                    Começar grátis
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </main>
    )
}
