'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { DatePicker } from '../components/ui/calendar'
import { format } from 'date-fns'

const defaultBusinessId = process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_ID || 'default-business'
const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

const appointmentSchema = z.object({
    serviceId: z.string().uuid('Selecione um serviço válido'),
    customerName: z.string().min(2, 'Informe o nome do cliente'),
    phone: z.string().min(8, 'Informe um telefone válido').regex(/^[0-9+()\-\s]+$/, 'Telefone inválido'),
    date: z.date({
        required_error: 'Selecione uma data',
    }),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Horário inválido'),
})

type AppointmentForm = z.infer<typeof appointmentSchema>

type Service = {
    id: string
    name: string
    price: string
    durationMinutes: number
}

type AppointmentItem = {
    id: string
    scheduledAt: string
    service: { name: string }
    customer: { name: string; phone: string }
}

type AppointmentApi = {
    serviceId: string;
    customerName: string;
    phone: string;
    date: string;
    time: string;
}

type PaginatedResponse<T> = {
    data: T[]
}

function normalizeListResponse<T>(payload: T[] | PaginatedResponse<T>) {
    return Array.isArray(payload) ? payload : payload.data
}

async function readJson<T>(response: Response): Promise<T | null> {
    return (await response.json().catch(() => null)) as T | null
}

export default function Home() {
    const {
        register,
        handleSubmit,
        watch,
        reset,
        control,
        setValue,
        formState: { errors },
    } = useForm<AppointmentForm>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            serviceId: '',
            customerName: '',
            phone: '',
            date: undefined,
            time: '09:00',
        },
    })

    const selectedServiceId = watch('serviceId')
    const selectedDate = watch('date')
    const selectedTime = watch('time')
    const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''

    const servicesQuery = useQuery<Service[]>({
        queryKey: ['services', defaultBusinessId],
        queryFn: async () => {
            const response = await fetch(`${apiBase}/businesses/${defaultBusinessId}/services`)
            if (!response.ok) {
                throw new Error('Não foi possível carregar os serviços')
            }
            const payload = await readJson<Service[] | PaginatedResponse<Service>>(response)

            if (!payload) {
                throw new Error('Resposta inválida ao carregar os serviços')
            }

            return normalizeListResponse(payload)
        },
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    })

    const availabilityQuery = useQuery<string[]>({
        queryKey: ['availability', defaultBusinessId, selectedServiceId, formattedDate],
        queryFn: async () => {
            if (!selectedServiceId || !formattedDate) return []
            const response = await fetch(
                `${apiBase}/businesses/${defaultBusinessId}/availability?serviceId=${selectedServiceId}&date=${formattedDate}`
            )
            if (!response.ok) {
                const payload = await readJson<{ message?: string }>(response)
                throw new Error(payload?.message || 'Não foi possível carregar disponibilidade')
            }
            const payload = await readJson<string[]>(response)

            if (!payload || !Array.isArray(payload)) {
                throw new Error('Resposta inválida ao carregar disponibilidade')
            }

            return payload
        },
        enabled: Boolean(selectedServiceId && formattedDate),
        refetchOnWindowFocus: false,
        retry: false,
    })

    const appointmentsQuery = useQuery<AppointmentItem[]>({
        queryKey: ['appointments', defaultBusinessId],
        queryFn: async () => {
            const response = await fetch(`${apiBase}/appointments?businessId=${defaultBusinessId}`)
            if (!response.ok) {
                throw new Error('Não foi possível carregar os agendamentos')
            }
            const payload = await readJson<AppointmentItem[] | PaginatedResponse<AppointmentItem>>(response)

            if (!payload) {
                throw new Error('Resposta inválida ao carregar os agendamentos')
            }

            return normalizeListResponse(payload)
        },
    })

    const appointmentMutation = useMutation({
        mutationFn: async (payload: AppointmentApi) => {
            const response = await fetch(`${apiBase}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId: defaultBusinessId, ...payload }),
            })
            if (!response.ok) {
                const message = await response.text()
                throw new Error(message || 'Erro ao criar agendamento')
            }
            return response.json()
        },
        onSuccess: async () => {
            toast.success('Agendamento criado com sucesso')
            reset({ serviceId: '', customerName: '', phone: '', date: undefined, time: '09:00' })
            await appointmentsQuery.refetch()
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Erro ao criar agendamento')
        },
    })

    const serviceOptions = servicesQuery.data ?? []
    const availableTimes = availabilityQuery.data ?? []
    const sortedAppointments = useMemo(
        () => [...(appointmentsQuery.data ?? [])].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
        [appointmentsQuery.data]
    )

    useEffect(() => {
        if (!selectedServiceId) {
            return
        }

        const selectedServiceStillExists = serviceOptions.some((service) => service.id === selectedServiceId)

        if (!selectedServiceStillExists) {
            setValue('serviceId', '')
            setValue('time', '')
            toast('Os serviços foram atualizados. Selecione uma nova opção.')
        }
    }, [selectedServiceId, serviceOptions, setValue])

    useEffect(() => {
        if (!selectedTime || availableTimes.length === 0) {
            return
        }

        const selectedTimeStillExists = availableTimes.includes(selectedTime)

        if (!selectedTimeStillExists) {
            setValue('time', '')
            toast('Os horários disponíveis foram atualizados. Escolha um novo horário.')
        }
    }, [availableTimes, selectedTime, setValue])

    const onSubmit = (data: AppointmentForm) => {

        const payload = {
            ...data,
            date: format(data.date, 'yyyy-MM-dd'),
        }


        console.log('PAYLOAD FINAL:', payload)

        appointmentMutation.mutate(payload)
    }

    return (
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10 lg:px-8">
            <Card>
                <div className="mb-4 space-y-2 sm:mb-6">
                    <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Reserva de serviço</p>
                    <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl lg:text-4xl">Agende seu atendimento com facilidade</h1>
                    <p className="max-w-2xl text-sm text-slate-600 sm:text-base">Selecione um serviço, escolha a data e veja apenas horários livres para o seu negócio.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
                    <Label className="space-y-2">
                        <span className="text-sm font-medium sm:text-base">Serviço</span>
                        <Select {...register('serviceId')} className="text-base">
                            <option value="">Selecione um serviço</option>
                            {serviceOptions.map((service) => (
                                <option key={service.id} value={service.id}>
                                    {service.name} - R$ {Number(service.price).toFixed(2)} ({service.durationMinutes} min)
                                </option>
                            ))}
                        </Select>
                        {errors.serviceId ? <p className="text-xs text-red-600 sm:text-sm">{errors.serviceId.message}</p> : null}
                    </Label>

                    <Label className="space-y-2">
                        <span className="text-sm font-medium sm:text-base">Nome</span>
                        <Input {...register('customerName')} placeholder="Nome completo" className="text-base" />
                        {errors.customerName ? <p className="text-xs text-red-600 sm:text-sm">{errors.customerName.message}</p> : null}
                    </Label>

                    <Label className="space-y-2">
                        <span className="text-sm font-medium sm:text-base">Telefone</span>
                        <Input {...register('phone')} placeholder="(11) 91234-5678" className="text-base" />
                        {errors.phone ? <p className="text-xs text-red-600 sm:text-sm">{errors.phone.message}</p> : null}
                    </Label>

                    <Label className="space-y-2">
                        <span className="text-sm font-medium sm:text-base">Data</span>
                        <DatePicker control={control} name="date" />
                        {errors.date ? <p className="text-xs text-red-600 sm:text-sm">{errors.date.message}</p> : null}
                    </Label>

                    <Label className="space-y-2 sm:col-span-2">
                        <span className="text-sm font-medium sm:text-base">Horário disponível</span>
                        <Select
                            {...register('time')}
                            disabled={!selectedServiceId || !selectedDate || availabilityQuery.isLoading}
                            className="text-base"
                        >
                            <option value="">
                                {!selectedServiceId
                                    ? 'Selecione primeiro um serviço'
                                    : !selectedDate
                                        ? 'Selecione uma data para ver os horários'
                                        : availabilityQuery.isLoading
                                            ? 'Verificando disponibilidade...'
                                        : 'Selecione um horário'}
                            </option>
                            {availableTimes.map((time) => (
                                <option key={time} value={time}>
                                    {time}
                                </option>
                            ))}
                        </Select>
                        {!selectedServiceId ? <p className="text-xs text-slate-500 sm:text-sm">Escolha um serviço para liberar a consulta de horários.</p> : null}
                        {selectedServiceId && !selectedDate ? (
                            <p className="text-xs text-slate-500 sm:text-sm">Agora escolha uma data para carregar os horários disponíveis.</p>
                        ) : null}
                        {availabilityQuery.isLoading ? <p className="text-xs text-slate-500 sm:text-sm">Verificando disponibilidade...</p> : null}
                        {availabilityQuery.isError ? (
                            <p className="text-xs text-red-600 sm:text-sm">
                                {availabilityQuery.error instanceof Error
                                    ? availabilityQuery.error.message
                                    : 'Não foi possível carregar a disponibilidade'}
                            </p>
                        ) : null}
                        {!availabilityQuery.isLoading && !availabilityQuery.isError && selectedServiceId && selectedDate && availableTimes.length === 0 ? (
                            <p className="text-xs text-slate-500 sm:text-sm">Sem horários livres para esta combinação.</p>
                        ) : null}
                        {errors.time ? <p className="text-xs text-red-600 sm:text-sm">{errors.time.message}</p> : null}
                    </Label>

                    <div className="sm:col-span-2">
                        <Button type="submit" disabled={appointmentMutation.status === 'pending'} className="w-full sm:w-auto">
                            {appointmentMutation.status === 'pending' ? 'Agendando...' : 'Confirmar reserva'}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card>
                <div className="mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Agenda pública</p>
                        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Próximos agendamentos</h2>
                    </div>
                    <span className="w-fit rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700 sm:text-sm">{appointmentsQuery.data?.length ?? 0} agendamentos</span>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {appointmentsQuery.isLoading ? (
                        <p className="text-sm text-slate-600 sm:text-base">Carregando agendamentos...</p>
                    ) : sortedAppointments.length === 0 ? (
                        <p className="text-sm text-slate-600 sm:text-base">Nenhum agendamento agendado para este negócio.</p>
                    ) : (
                        sortedAppointments.map((appointment) => (
                            <div key={appointment.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-base font-semibold text-slate-900 sm:text-lg">{appointment.customer.name}</p>
                                        <p className="text-xs text-slate-600 sm:text-sm">{appointment.customer.phone}</p>
                                        <p className="text-xs text-slate-500 sm:text-sm">{appointment.service?.name}</p>
                                    </div>
                                    <div className="text-xs text-slate-500 sm:text-sm">
                                        {new Date(appointment.scheduledAt).toLocaleString('pt-BR', {
                                            dateStyle: 'short',
                                            timeStyle: 'short',
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </main>
    )
}
