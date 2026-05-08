'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { DatePicker } from '../ui/calendar'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { BookingSummary } from './BookingSummary'
import { StepIndicator } from './StepIndicator'

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/backend'

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
type BookingStep = 'service' | 'details' | 'schedule' | 'review'

type Service = {
    id: string
    name: string
    price: string
    durationMinutes: number
}

type AppointmentApi = {
    serviceId: string
    customerName: string
    phone: string
    date: string
    time: string
}

type CreatedAppointmentResponse = {
    publicToken?: string | null
    publicUrl?: string | null
}

type PaginatedResponse<T> = {
    data: T[]
}

type PublicBookingPageProps = {
    businessId: string
    eyebrow?: string
    headline?: string
}

const bookingSteps: Array<{ id: BookingStep; label: string }> = [
    { id: 'service', label: 'Serviço' },
    { id: 'details', label: 'Seus dados' },
    { id: 'schedule', label: 'Data e horário' },
    { id: 'review', label: 'Confirmação' },
]

function getStepIndex(step: BookingStep) {
    return bookingSteps.findIndex((item) => item.id === step)
}

function normalizeListResponse<T>(payload: T[] | PaginatedResponse<T>) {
    return Array.isArray(payload) ? payload : payload.data
}

async function readJson<T>(response: Response): Promise<T | null> {
    return (await response.json().catch(() => null)) as T | null
}

export function PublicBookingPage({
    businessId,
    eyebrow = 'Reserva de serviço',
    headline = 'Agende seu atendimento com facilidade',
}: PublicBookingPageProps) {
    const [currentStep, setCurrentStep] = useState<BookingStep>('service')
    const [createdAppointmentLink, setCreatedAppointmentLink] = useState<string | null>(null)
    const bookingFormTopRef = useRef<HTMLFormElement | null>(null)
    const {
        register,
        handleSubmit,
        watch,
        reset,
        control,
        setValue,
        trigger,
        formState: { errors },
    } = useForm<AppointmentForm>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            serviceId: '',
            customerName: '',
            phone: '',
            date: undefined,
            time: '',
        },
    })

    const selectedServiceId = watch('serviceId')
    const selectedDate = watch('date')
    const selectedTime = watch('time')
    const customerName = watch('customerName')
    const phone = watch('phone')
    const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''

    const servicesQuery = useQuery<Service[]>({
        queryKey: ['services', businessId],
        queryFn: async () => {
            const response = await fetch(`${apiBase}/businesses/${businessId}/services`)
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
        queryKey: ['availability', businessId, selectedServiceId, formattedDate],
        queryFn: async () => {
            if (!selectedServiceId || !formattedDate) return []
            const response = await fetch(
                `${apiBase}/businesses/${businessId}/availability?serviceId=${selectedServiceId}&date=${formattedDate}`
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

    const appointmentMutation = useMutation({
        mutationFn: async (appointmentData: AppointmentApi) => {
            const response = await fetch(`${apiBase}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId, ...appointmentData }),
            })
            if (!response.ok) {
                const errorPayload = await readJson<{ message?: string }>(response)
                throw new Error(errorPayload?.message || 'Erro ao criar agendamento')
            }
            const createdAppointment = await readJson<CreatedAppointmentResponse>(response)

            if (!createdAppointment) {
                throw new Error('Resposta inválida ao criar agendamento')
            }

            return createdAppointment
        },
        onSuccess: async (createdAppointment) => {
            toast.success('Agendamento criado com sucesso')
            const appointmentLink =
                createdAppointment.publicToken
                    ? `/appointments/${createdAppointment.publicToken}`
                    : createdAppointment.publicUrl ?? null

            setCreatedAppointmentLink(appointmentLink)
            reset({ serviceId: '', customerName: '', phone: '', date: undefined, time: '' })
            setCurrentStep('service')
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Erro ao criar agendamento')
        },
    })

    const serviceOptions = servicesQuery.data ?? []
    const availableTimes = availabilityQuery.data ?? []
    const selectedService = serviceOptions.find((service) => service.id === selectedServiceId) ?? null
    const selectedDateLabel = selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''

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

    useEffect(() => {
        bookingFormTopRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        })
    }, [currentStep])

    const onSubmit = (data: AppointmentForm) => {
        appointmentMutation.mutate({
            ...data,
            date: format(data.date, 'yyyy-MM-dd'),
        })
    }

    const handleAdvanceStep = async () => {
        if (currentStep === 'service') {
            const isValid = await trigger('serviceId')
            if (isValid) setCurrentStep('details')
            return
        }

        if (currentStep === 'details') {
            const isValid = await trigger(['customerName', 'phone'])
            if (isValid) setCurrentStep('schedule')
            return
        }

        if (currentStep === 'schedule') {
            const isValid = await trigger(['date', 'time'])
            if (isValid) setCurrentStep('review')
        }
    }

    const handleStepBack = () => {
        if (currentStep === 'review') {
            setCurrentStep('schedule')
            return
        }

        if (currentStep === 'schedule') {
            setCurrentStep('details')
            return
        }

        if (currentStep === 'details') {
            setCurrentStep('service')
        }
    }

    if (createdAppointmentLink) {
        return (
            <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-5 overflow-x-hidden px-4 py-5 sm:gap-6 sm:px-6 sm:py-7 lg:px-8 lg:py-10">
                <Card className="border-purple-100 bg-white shadow-sm shadow-purple-100/40">
                    <div className="space-y-4">
                        <div className="space-y-1.5 sm:space-y-2">
                            <p className="text-xs uppercase tracking-[.3em] text-violet-700 sm:text-sm">Reserva confirmada</p>
                            <h1 className="text-[1.75rem] font-semibold leading-tight text-slate-900 sm:text-3xl">
                                Seu agendamento foi criado
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                                Você já pode acompanhar os detalhes da sua reserva pelo link abaixo.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-sm font-medium text-slate-900">Guarde este acesso para consultar ou cancelar seu agendamento.</p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link href={createdAppointmentLink} className="w-full sm:w-auto">
                                <Button type="button" className="w-full sm:w-auto">
                                    Ver meu agendamento
                                </Button>
                            </Link>

                            <Button
                                type="button"
                                variant="secondary"
                                className="w-full sm:w-auto"
                                onClick={() => setCreatedAppointmentLink(null)}
                            >
                                Fazer nova reserva
                            </Button>
                        </div>
                    </div>
                </Card>
            </main>
        )
    }

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 overflow-x-hidden px-4 py-5 sm:gap-6 sm:px-6 sm:py-7 lg:px-8 lg:py-10">
            <Card className="border-purple-100 bg-white shadow-sm shadow-purple-100/40">
                <div className="space-y-3">
                    <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-xs uppercase tracking-[.3em] text-violet-700 sm:text-sm">{eyebrow}</p>
                        <h1 className="text-[1.75rem] font-semibold leading-tight text-slate-900 sm:text-3xl lg:text-[2rem]">{headline}</h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                            Escolha um serviço, informe seus dados e confirme um horário livre sem sair do celular.
                        </p>
                    </div>

                    <StepIndicator currentStep={currentStep} steps={bookingSteps} />
                </div>
            </Card>

            <form
                ref={bookingFormTopRef}
                onSubmit={handleSubmit(onSubmit)}
                className="grid gap-5 md:items-start md:gap-6 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1.15fr)_360px]"
            >
                <div className="min-w-0 space-y-5 lg:max-w-3xl lg:space-y-6">
                    <Card className={currentStep === 'service' ? 'block' : 'hidden'}>
                        <div className="space-y-4 sm:space-y-5">
                            <div>
                                <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Etapa 1</p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Escolha o serviço</h2>
                            </div>

                            {servicesQuery.isLoading ? (
                                <p className="text-sm text-slate-600">Carregando serviços...</p>
                            ) : servicesQuery.isError ? (
                                <p className="text-sm text-red-600">Não foi possível carregar os serviços.</p>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {serviceOptions.map((service) => {
                                        const isSelected = service.id === selectedServiceId

                                        return (
                                            <button
                                                key={service.id}
                                                type="button"
                                                onClick={() => {
                                                    setValue('serviceId', service.id, { shouldValidate: true })
                                                    setValue('time', '', { shouldValidate: true })
                                                }}
                                                className={[
                                                    'group w-full rounded-3xl border p-3.5 text-left transition focus:outline-none focus:ring-2 focus:ring-purple-200 sm:p-4',
                                                    isSelected
                                                        ? 'border-purple-400 bg-purple-50 shadow-md shadow-purple-100 ring-1 ring-purple-100'
                                                        : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50 hover:shadow-sm',
                                                ].join(' ')}
                                            >
                                                <div className="flex min-w-0 flex-col gap-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0 space-y-1.5">
                                                            <p className="text-base font-semibold leading-6 text-slate-900">{service.name}</p>
                                                            <p className="text-sm text-slate-500">Atendimento com duracao definida.</p>
                                                        </div>
                                                        <span
                                                            className={[
                                                                'shrink-0 rounded-full px-3 py-1 text-sm font-semibold',
                                                                isSelected ? 'bg-purple-700 text-white' : 'bg-slate-100 text-purple-700',
                                                            ].join(' ')}
                                                        >
                                                            R$ {Number(service.price).toFixed(2)}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={[
                                                                'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[.2em]',
                                                                isSelected ? 'bg-white text-purple-700' : 'bg-slate-100 text-slate-600',
                                                            ].join(' ')}
                                                        >
                                                            {service.durationMinutes} min
                                                        </span>
                                                        {isSelected ? (
                                                            <span className="rounded-full bg-purple-700 px-3 py-1 text-xs font-semibold uppercase tracking-[.2em] text-white">
                                                                Selecionado
                                                            </span>
                                                        ) : (
                                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 transition group-hover:bg-purple-50 group-hover:text-purple-700">
                                                                Toque para escolher
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {errors.serviceId ? <p className="text-sm text-red-600">{errors.serviceId.message}</p> : null}

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button type="button" onClick={handleAdvanceStep} className="w-full sm:w-auto">
                                    Continuar
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className={currentStep === 'details' ? 'block' : 'hidden'}>
                        <div className="space-y-4 sm:space-y-5">
                            <div>
                                <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Etapa 2</p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Seus dados</h2>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Label className="space-y-2">
                                    <span className="text-sm font-medium sm:text-base">Nome</span>
                                    <Input {...register('customerName')} placeholder="Nome completo" className="text-sm sm:text-base" />
                                    {errors.customerName ? <p className="text-xs text-red-600 sm:text-sm">{errors.customerName.message}</p> : null}
                                </Label>

                                <Label className="space-y-2">
                                    <span className="text-sm font-medium sm:text-base">Telefone</span>
                                    <Input {...register('phone')} placeholder="(11) 91234-5678" className="text-sm sm:text-base" />
                                    {errors.phone ? <p className="text-xs text-red-600 sm:text-sm">{errors.phone.message}</p> : null}
                                </Label>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                                <Button type="button" variant="secondary" onClick={handleStepBack} className="w-full sm:w-auto">
                                    Voltar
                                </Button>
                                <Button type="button" onClick={handleAdvanceStep} className="w-full sm:w-auto">
                                    Continuar
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className={currentStep === 'schedule' ? 'block' : 'hidden'}>
                        <div className="space-y-4 sm:space-y-5">
                            <div>
                                <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Etapa 3</p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Escolha data e horário</h2>
                            </div>

                            <Label className="space-y-2">
                                <span className="text-sm font-medium sm:text-base">Data</span>
                                <DatePicker control={control} name="date" />
                                {errors.date ? <p className="text-xs text-red-600 sm:text-sm">{errors.date.message}</p> : null}
                            </Label>

                            {!selectedServiceId ? <p className="text-sm text-slate-500">Selecione um serviço antes de escolher o horário.</p> : null}
                            {selectedServiceId && !selectedDate ? <p className="text-sm text-slate-500">Escolha uma data para ver os horários disponíveis.</p> : null}
                            {availabilityQuery.isLoading ? <p className="text-sm text-slate-500">Verificando disponibilidade...</p> : null}
                            {availabilityQuery.isError ? (
                                <p className="text-sm text-red-600">
                                    {availabilityQuery.error instanceof Error
                                        ? availabilityQuery.error.message
                                        : 'Não foi possível carregar a disponibilidade'}
                                </p>
                            ) : null}

                            {!availabilityQuery.isLoading && !availabilityQuery.isError && selectedServiceId && selectedDate ? (
                                availableTimes.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
                                        {availableTimes.map((time) => {
                                            const isSelected = time === selectedTime

                                            return (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    onClick={() => {
                                                        setValue('time', time, { shouldValidate: true })
                                                    }}
                                                    className={[
                                                        'min-h-12 rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-purple-200 sm:min-h-14 sm:px-4 sm:text-base',
                                                        isSelected
                                                            ? 'border-purple-300 bg-purple-700 text-white'
                                                            : 'border-slate-200 bg-white text-slate-900 hover:border-purple-200 hover:bg-slate-50',
                                                    ].join(' ')}
                                                >
                                                    {time}
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500">Sem horários livres para esta combinação.</p>
                                )
                            ) : null}

                            {errors.time ? <p className="text-sm text-red-600">{errors.time.message}</p> : null}

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                                <Button type="button" variant="secondary" onClick={handleStepBack} className="w-full sm:w-auto">
                                    Voltar
                                </Button>
                                <Button type="button" onClick={handleAdvanceStep} className="w-full sm:w-auto">
                                    Continuar
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className={currentStep === 'review' ? 'block' : 'hidden'}>
                        <div className="space-y-4 sm:space-y-5">
                            <div>
                                <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Etapa 4</p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Confira e confirme</h2>
                            </div>

                            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 sm:gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[.2em] text-slate-500">Serviço</p>
                                    <p className="mt-1 font-medium text-slate-900">{selectedService?.name || 'Não selecionado'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[.2em] text-slate-500">Horário</p>
                                    <p className="mt-1 font-medium text-slate-900">
                                        {selectedDate && selectedTime
                                            ? `${format(selectedDate, 'dd/MM/yyyy')} às ${selectedTime}`
                                            : 'Não selecionado'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[.2em] text-slate-500">Duração</p>
                                    <p className="mt-1 font-medium text-slate-900">
                                        {selectedService ? `${selectedService.durationMinutes} min` : 'Não selecionada'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[.2em] text-slate-500">Valor</p>
                                    <p className="mt-1 font-medium text-slate-900">
                                        {selectedService ? `R$ ${Number(selectedService.price).toFixed(2)}` : 'Não selecionado'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[.2em] text-slate-500">Cliente</p>
                                    <p className="mt-1 font-medium text-slate-900">{customerName || 'Não informado'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[.2em] text-slate-500">Telefone</p>
                                    <p className="mt-1 font-medium text-slate-900">{phone || 'Não informado'}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                                <Button type="button" variant="secondary" onClick={handleStepBack} className="w-full sm:w-auto">
                                    Voltar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={appointmentMutation.status === 'pending'}
                                    className="min-h-12 w-full sm:w-auto"
                                >
                                    {appointmentMutation.status === 'pending' ? 'Agendando...' : 'Confirmar reserva'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="min-w-0 space-y-4 md:space-y-5 lg:space-y-6">
                    <div className="md:sticky md:top-6">
                        <div className="mb-3 md:mb-4">
                            <BookingSummary
                                serviceName={selectedService?.name}
                                durationMinutes={selectedService?.durationMinutes}
                                price={selectedService?.price}
                                dateLabel={selectedDateLabel || undefined}
                                time={selectedTime || undefined}
                                customerName={customerName || undefined}
                                phone={phone || undefined}
                                isReviewStep={currentStep === 'review'}
                                isSubmitting={appointmentMutation.status === 'pending'}
                            />
                        </div>

                        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Agenda pública</p>
                                    <h2 className="mt-1.5 text-lg font-semibold text-slate-900 sm:mt-2 sm:text-2xl">Agenda pública</h2>
                                </div>

                                <p className="text-sm leading-6 text-slate-600">
                                    Veja os próximos horários já reservados.
                                </p>

                                <a
                                    href={`/b/${encodeURIComponent(businessId)}/agenda`}
                                    className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200 sm:w-auto sm:px-6 sm:text-sm"
                                >
                                    Ver agenda pública
                                </a>
                            </div>
                        </Card>
                    </div>
                </div>
            </form>
        </main>
    )
}
