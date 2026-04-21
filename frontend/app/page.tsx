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
    // date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Data inválida'),
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

const testPayload1 = {
  serviceId: '1a11bb85-2c84-4248-b4f1-b4734a426488',
  customerName: 'João Silva',
  phone: '(11) 91234-5678',
  date: '2026-04-18',
  time: '07:00',
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
            return response.json()
        },
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        refetchInterval: 5000,
    })

    const availabilityQuery = useQuery<string[]>({
        queryKey: ['availability', defaultBusinessId, selectedServiceId, formattedDate],
        queryFn: async () => {
            if (!selectedServiceId || !formattedDate) return []
            const response = await fetch(
                `${apiBase}/businesses/${defaultBusinessId}/availability?serviceId=${selectedServiceId}&date=${formattedDate}`
            )
            if (!response.ok) {
                throw new Error('Não foi possível carregar disponibilidade')
            }
            return response.json()
        },
        enabled: Boolean(selectedServiceId && formattedDate),
        refetchOnWindowFocus: true,
        refetchInterval: selectedServiceId && formattedDate ? 5000 : false,
    })

    const appointmentsQuery = useQuery<AppointmentItem[]>({
        queryKey: ['appointments', defaultBusinessId],
        queryFn: async () => {
            const response = await fetch(`${apiBase}/appointments?businessId=${defaultBusinessId}`)
            if (!response.ok) {
                throw new Error('Não foi possível carregar os agendamentos')
            }
            return response.json()
        },
    })

   {} const appointmentMutation = useMutation({
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
        <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
            <Card>
                <div className="mb-6 space-y-2">
                    <p className="text-sm uppercase tracking-[.3em] text-purple-700">Reserva de serviço</p>
                    <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Agende seu atendimento com facilidade</h1>
                    <p className="max-w-2xl text-slate-600">Selecione um serviço, escolha a data e veja apenas horários livres para o seu negócio.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
                    <Label className="space-y-2">
                        <span>Serviço</span>
                        <Select {...register('serviceId')}>
                            <option value="">Selecione um serviço</option>
                            {serviceOptions.map((service) => (
                                <option key={service.id} value={service.id}>
                                    {service.name} - R$ {Number(service.price).toFixed(2)} ({service.durationMinutes} min)
                                </option>
                            ))}
                        </Select>
                        {errors.serviceId ? <p className="text-sm text-red-600">{errors.serviceId.message}</p> : null}
                    </Label>

                    <Label className="space-y-2">
                        <span>Nome</span>
                        <Input {...register('customerName')} placeholder="Nome completo" />
                        {errors.customerName ? <p className="text-sm text-red-600">{errors.customerName.message}</p> : null}
                    </Label>

                    <Label className="space-y-2">
                        <span>Telefone</span>
                        <Input {...register('phone')} placeholder="(11) 91234-5678" />
                        {errors.phone ? <p className="text-sm text-red-600">{errors.phone.message}</p> : null}
                    </Label>

                    <Label className="space-y-2">
                        <span>Data</span>
                        <DatePicker control={control} name="date" />
                        {/* <Input type="date" {...register('date')} /> */}
                        {errors.date ? <p className="text-sm text-red-600">{errors.date.message}</p> : null}
                    </Label>

                    <Label className="space-y-2 sm:col-span-2">
                        <span>Horário disponível</span>
                        <Select {...register('time')} disabled={!selectedServiceId || !selectedDate || availabilityQuery.isFetching}>
                            <option value="">
                                {!selectedServiceId
                                    ? 'Selecione primeiro um serviço'
                                    : !selectedDate
                                        ? 'Selecione uma data para ver os horários'
                                        : 'Selecione um horário'}
                            </option>
                            {availableTimes.map((time) => (
                                <option key={time} value={time}>
                                    {time}
                                </option>
                            ))}
                        </Select>
                        {!selectedServiceId ? <p className="text-sm text-slate-500">Escolha um serviço para liberar a consulta de horários.</p> : null}
                        {selectedServiceId && !selectedDate ? (
                            <p className="text-sm text-slate-500">Agora escolha uma data para carregar os horários disponíveis.</p>
                        ) : null}
                        {availabilityQuery.isFetching ? <p className="text-sm text-slate-500">Verificando disponibilidade...</p> : null}
                        {!availabilityQuery.isFetching && selectedServiceId && selectedDate && availableTimes.length === 0 ? (
                            <p className="text-sm text-slate-500">Sem horários livres para esta combinação.</p>
                        ) : null}
                        {errors.time ? <p className="text-sm text-red-600">{errors.time.message}</p> : null}
                    </Label>

                    <div className="sm:col-span-2">
                        <Button type="submit" disabled={appointmentMutation.status === 'pending'}>
                            {appointmentMutation.status === 'pending' ? 'Agendando...' : 'Confirmar reserva'}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card>
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[.3em] text-purple-700">Agenda pública</p>
                        <h2 className="text-2xl font-semibold text-slate-900">Próximos agendamentos</h2>
                    </div>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700">{appointmentsQuery.data?.length ?? 0} agendamentos</span>
                </div>

                <div className="space-y-4">
                    {appointmentsQuery.isLoading ? (
                        <p className="text-slate-600">Carregando agendamentos...</p>
                    ) : sortedAppointments.length === 0 ? (
                        <p className="text-slate-600">Nenhum agendamento agendado para este negócio.</p>
                    ) : (
                        sortedAppointments.map((appointment) => (
                            <div key={appointment.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-lg font-semibold text-slate-900">{appointment.customer.name}</p>
                                        <p className="text-sm text-slate-600">{appointment.customer.phone}</p>
                                        <p className="text-sm text-slate-500">{appointment.service?.name}</p>
                                    </div>
                                    <div className="text-sm text-slate-500">
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
