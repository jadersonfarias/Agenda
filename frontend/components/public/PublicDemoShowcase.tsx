'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import {
    demoBusiness,
    demoCustomerPreset,
    demoDays,
    demoNotice,
    demoSchedule,
    demoServices,
    demoTeam,
} from '../../features/demo/demo-data'
import { BookingSummary } from './BookingSummary'
import { StepIndicator } from './StepIndicator'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

const signupLink = '/signup'
const landingLink = '/'

type DemoBookingStep = 'service' | 'details' | 'schedule' | 'review'

const demoBookingSteps: Array<{ id: DemoBookingStep; label: string }> = [
    { id: 'service', label: 'Serviço' },
    { id: 'details', label: 'Seus dados' },
    { id: 'schedule', label: 'Data e horário' },
    { id: 'review', label: 'Confirmação' },
]

const availableDemoSlots = demoSchedule.filter((slot) => slot.status === 'available')

export function PublicDemoShowcase() {
    const [currentStep, setCurrentStep] = useState<DemoBookingStep>('service')
    const [selectedServiceId, setSelectedServiceId] = useState('')
    const [customerName, setCustomerName] = useState(demoCustomerPreset.name)
    const [phone, setPhone] = useState(demoCustomerPreset.phone)
    const [selectedDayId, setSelectedDayId] = useState(demoDays[0]?.id ?? '')
    const [selectedProfessionalId, setSelectedProfessionalId] = useState(demoTeam[0]?.id ?? '')
    const [selectedTime, setSelectedTime] = useState('')
    const [stepError, setStepError] = useState<string | null>(null)
    const [isCompleted, setIsCompleted] = useState(false)
    const bookingFormTopRef = useRef<HTMLFormElement | null>(null)

    const selectedService = demoServices.find((service) => service.id === selectedServiceId) ?? null
    const selectedDay = demoDays.find((day) => day.id === selectedDayId) ?? null
    const selectedProfessional = demoTeam.find((member) => member.id === selectedProfessionalId) ?? null
    const selectedDateLabel = selectedDay?.summaryLabel ?? ''
    const canChooseTime = Boolean(selectedDayId && selectedProfessionalId)

    useEffect(() => {
        bookingFormTopRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        })
    }, [currentStep])

    useEffect(() => {
        setStepError(null)
    }, [currentStep, customerName, phone, selectedDayId, selectedProfessionalId, selectedServiceId, selectedTime])

    const handleAdvanceStep = () => {
        if (currentStep === 'service') {
            if (!selectedServiceId) {
                setStepError('Selecione um serviço para continuar na demonstração.')
                return
            }

            setCurrentStep('details')
            return
        }

        if (currentStep === 'details') {
            if (customerName.trim().length < 2) {
                setStepError('Informe um nome fictício para seguir com a demonstração.')
                return
            }

            if (phone.trim().length < 8) {
                setStepError('Informe um telefone fictício válido para continuar.')
                return
            }

            setCurrentStep('schedule')
            return
        }

        if (currentStep === 'schedule') {
            if (!selectedDayId) {
                setStepError('Escolha uma data fictícia para visualizar o fluxo.')
                return
            }

            if (!selectedProfessionalId) {
                setStepError('Selecione um responsável fictício para continuar.')
                return
            }

            if (!selectedTime) {
                setStepError('Selecione um horário livre para continuar.')
                return
            }

            setCurrentStep('review')
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

    const handleDemoSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (currentStep !== 'review') {
            return
        }

        setIsCompleted(true)
    }

    const resetDemo = () => {
        setCurrentStep('service')
        setSelectedServiceId('')
        setCustomerName(demoCustomerPreset.name)
        setPhone(demoCustomerPreset.phone)
        setSelectedDayId(demoDays[0]?.id ?? '')
        setSelectedProfessionalId(demoTeam[0]?.id ?? '')
        setSelectedTime('')
        setStepError(null)
        setIsCompleted(false)
    }

    if (isCompleted) {
        return (
            <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 overflow-x-hidden px-3 py-4 sm:gap-6 sm:px-6 sm:py-7 lg:px-8 lg:py-10">
                <Card className="border-purple-100 bg-white shadow-sm shadow-purple-100/40">
                    <div className="space-y-4 sm:space-y-5">
                        <div className="space-y-1.5 sm:space-y-2">
                            <p className="text-xs uppercase tracking-[.3em] text-violet-700 sm:text-sm">Demonstração concluída</p>
                            <h1 className="text-[1.6rem] font-semibold leading-tight text-slate-900 sm:text-3xl">
                                Nenhum agendamento real foi criado
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                                Você percorreu o mesmo passo a passo visual da reserva pública, mas com dados 100% fictícios e sem envio para backend.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/60 px-4 py-4">
                            <p className="text-sm font-medium text-slate-900">
                                Demonstração concluída. Nenhum agendamento real foi criado.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Serviço</span>
                                <span className="mt-1 block font-medium text-slate-900">
                                    {selectedService?.name || 'Não selecionado'}
                                </span>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Data e horário</span>
                                <span className="mt-1 block font-medium text-slate-900">
                                    {selectedDateLabel && selectedTime ? `${selectedDateLabel} às ${selectedTime}` : 'Não selecionado'}
                                </span>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Profissional</span>
                                <span className="mt-1 block font-medium text-slate-900">
                                    {selectedProfessional?.name || 'Não selecionado'}
                                </span>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Negócio demo</span>
                                <span className="mt-1 block font-medium text-slate-900">{demoBusiness.name}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <Link href={signupLink} className="w-full sm:w-auto">
                                <Button type="button" className="w-full sm:w-auto">
                                    Criar minha conta grátis
                                </Button>
                            </Link>

                            <Link href={landingLink} className="w-full sm:w-auto">
                                <Button type="button" variant="secondary" className="w-full sm:w-auto">
                                    Voltar para a landing
                                </Button>
                            </Link>

                            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={resetDemo}>
                                Refazer demonstração
                            </Button>
                        </div>
                    </div>
                </Card>
            </main>
        )
    }

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 overflow-x-hidden px-3 py-4 sm:gap-6 sm:px-6 sm:py-7 lg:px-8 lg:py-10">
            <Card className="border-purple-100 bg-white shadow-sm shadow-purple-100/40">
                <div className="space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-xs uppercase tracking-[.3em] text-violet-700 sm:text-sm">Demonstração fictícia</p>
                        <h1 className="text-[1.6rem] font-semibold leading-tight text-slate-900 sm:text-3xl lg:text-[2rem]">
                            Veja como funciona a reserva pública da MarcaCerta
                        </h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                            A demo segue o mesmo fluxo visual da página pública real: escolha do serviço, dados do cliente, data e horário, e confirmação final.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Negócio demo</p>
                            <p className="mt-2 break-words text-base font-semibold text-slate-900">{demoBusiness.name}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Funcionamento</p>
                            <p className="mt-2 break-words text-base font-semibold text-slate-900">{demoBusiness.hoursLabel}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Cidade</p>
                            <p className="mt-2 break-words text-base font-semibold text-slate-900">{demoBusiness.city}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Horários demo</p>
                            <p className="mt-2 text-base font-semibold text-slate-900">{availableDemoSlots.length} horários livres no preview</p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-dashed border-purple-200 bg-purple-50/60 px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[.2em] text-purple-700">Importante</p>
                        <div className="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
                            <p>Esta é uma demonstração com dados fictícios.</p>
                            <p>Nenhum cadastro, cliente ou agendamento real será criado.</p>
                            <p>O cadastro real acontece apenas em /signup.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Link href={signupLink} className="w-full sm:w-auto">
                            <Button type="button" className="w-full sm:w-auto">
                                Criar minha conta grátis
                            </Button>
                        </Link>

                        <Link href={landingLink} className="w-full sm:w-auto">
                            <Button type="button" variant="secondary" className="w-full sm:w-auto">
                                Voltar para a landing
                            </Button>
                        </Link>
                    </div>

                    <StepIndicator currentStep={currentStep} steps={demoBookingSteps} />
                </div>
            </Card>

            <form
                ref={bookingFormTopRef}
                onSubmit={handleDemoSubmit}
                className="grid gap-4 md:items-start md:gap-6 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1.15fr)_360px]"
            >
                <div className="min-w-0 space-y-4 lg:max-w-3xl lg:space-y-6">
                    <Card className={currentStep === 'service' ? 'block' : 'hidden'}>
                        <div className="space-y-4 sm:space-y-5">
                            <div>
                                <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Etapa 1</p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Escolha o serviço</h2>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                {demoServices.map((service) => {
                                    const isSelected = service.id === selectedServiceId

                                    return (
                                        <button
                                            key={service.id}
                                            type="button"
                                            onClick={() => setSelectedServiceId(service.id)}
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
                                                        <p className="text-sm text-slate-500">Atendimento fictício com duração definida.</p>
                                                    </div>
                                                    <span
                                                        className={[
                                                            'shrink-0 rounded-full px-3 py-1 text-sm font-semibold',
                                                            isSelected ? 'bg-purple-700 text-white' : 'bg-slate-100 text-purple-700',
                                                        ].join(' ')}
                                                    >
                                                        {service.priceLabel}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={[
                                                            'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[.2em]',
                                                            isSelected ? 'bg-white text-purple-700' : 'bg-slate-100 text-slate-600',
                                                        ].join(' ')}
                                                    >
                                                        {service.durationLabel}
                                                    </span>
                                                    {isSelected ? (
                                                        <span className="rounded-full bg-purple-700 px-3 py-1 text-xs font-semibold uppercase tracking-[.2em] text-white">
                                                            Selecionado
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 transition group-hover:bg-purple-50 group-hover:text-purple-700">
                                                            Selecionar
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            {stepError ? <p className="text-sm text-red-600">{stepError}</p> : null}

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
                                <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Dados do cliente simulados</h2>
                            </div>

                            <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/50 px-4 py-4">
                                <p className="text-sm leading-6 text-slate-700">
                                    Nome e telefone já começam preenchidos com dados fictícios para você sentir o fluxo real da reserva sem criar cadastro.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Label className="space-y-2">
                                    <span className="text-sm font-medium sm:text-base">Nome</span>
                                    <Input
                                        value={customerName}
                                        onChange={(event) => setCustomerName(event.target.value)}
                                        placeholder="Nome completo"
                                        className="text-sm sm:text-base"
                                    />
                                </Label>

                                <Label className="space-y-2">
                                    <span className="text-sm font-medium sm:text-base">Telefone</span>
                                    <Input
                                        value={phone}
                                        onChange={(event) => setPhone(event.target.value)}
                                        placeholder="(48) 99999-1234"
                                        className="text-sm sm:text-base"
                                    />
                                </Label>
                            </div>

                            {stepError ? <p className="text-sm text-red-600">{stepError}</p> : null}

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
                                <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Data e horário</h2>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-medium text-slate-900 sm:text-base">Escolha uma data</p>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {demoDays.map((day) => {
                                        const isSelected = day.id === selectedDayId

                                        return (
                                            <button
                                                key={day.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedDayId(day.id)
                                                    setSelectedTime('')
                                                }}
                                                className={[
                                                    'rounded-3xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-purple-200',
                                                    isSelected
                                                        ? 'border-purple-300 bg-purple-50 shadow-sm shadow-purple-100'
                                                        : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50',
                                                ].join(' ')}
                                            >
                                                <span className="block text-xs uppercase tracking-[.2em] text-slate-500">{day.weekdayLabel}</span>
                                                <span className="mt-2 block text-base font-semibold text-slate-900">{day.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-medium text-slate-900 sm:text-base">Responsável fictício</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {demoTeam.map((member) => {
                                        const isSelected = member.id === selectedProfessionalId

                                        return (
                                            <button
                                                key={member.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedProfessionalId(member.id)
                                                    setSelectedTime('')
                                                }}
                                                className={[
                                                    'flex items-center justify-between rounded-3xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-purple-200',
                                                    isSelected
                                                        ? 'border-purple-300 bg-purple-50 shadow-sm shadow-purple-100'
                                                        : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50',
                                                ].join(' ')}
                                            >
                                                <div>
                                                    <p className="text-base font-semibold text-slate-900">{member.name}</p>
                                                    <p className="mt-1 text-sm text-slate-500">Disponível na demonstração</p>
                                                </div>
                                                <span
                                                    className={[
                                                        'inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold',
                                                        isSelected ? 'bg-purple-700 text-white' : 'bg-slate-100 text-purple-700',
                                                    ].join(' ')}
                                                >
                                                    {member.name.slice(0, 1)}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Este preview de horários fica apenas na demo e pode inspirar melhorias futuras sem alterar o fluxo real de /b/[slug]. */}
                            <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/50 px-4 py-4">
                                <p className="text-[11px] uppercase tracking-[.2em] text-purple-700">Preview de horários</p>
                                <p className="mt-2 text-sm leading-6 text-slate-700">
                                    Aqui o visitante visualiza horários fictícios livres e reservados em um formato simples, sem transformar isso em regra real da aplicação neste momento.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-medium text-slate-900 sm:text-base">Escolha um horário</p>
                                {!canChooseTime ? (
                                    <p className="text-sm text-slate-500">
                                        Selecione uma data e um responsável fictício para liberar os horários.
                                    </p>
                                ) : null}
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
                                    {demoSchedule.map((slot) => {
                                        const isReserved = slot.status === 'reserved'
                                        const isSelected = slot.time === selectedTime
                                        const isDisabled = isReserved || !canChooseTime

                                        return (
                                            <button
                                                key={slot.time}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => setSelectedTime(slot.time)}
                                                className={[
                                                    'min-h-12 rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-purple-200 sm:min-h-14 sm:px-4 sm:text-base',
                                                    isReserved
                                                        ? 'cursor-not-allowed border-rose-200 bg-rose-50 text-rose-500 opacity-80'
                                                        : !canChooseTime
                                                            ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                                                        : isSelected
                                                            ? 'border-purple-300 bg-purple-700 text-white'
                                                            : 'border-slate-200 bg-white text-slate-900 hover:border-purple-200 hover:bg-slate-50',
                                                ].join(' ')}
                                            >
                                                <span className="block">{slot.time}</span>
                                                <span className="mt-1 block text-[11px] font-medium uppercase tracking-[.15em]">
                                                    {isReserved ? 'Reservado' : 'Livre'}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {stepError ? <p className="text-sm text-red-600">{stepError}</p> : null}

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
                                <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Confirmação simulada</h2>
                            </div>

                            <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/50 px-4 py-4">
                                <p className="text-sm leading-6 text-slate-700">
                                    Revise os dados fictícios abaixo e conclua a demonstração. Nenhum agendamento será enviado, salvo ou misturado com dados reais.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Responsável demo</span>
                                    <span className="mt-1 block font-medium text-slate-900">
                                        {selectedProfessional?.name || 'Não selecionado'}
                                    </span>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Negócio</span>
                                    <span className="mt-1 block font-medium text-slate-900">{demoBusiness.name}</span>
                                </div>
                            </div>

                            {stepError ? <p className="text-sm text-red-600">{stepError}</p> : null}

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                                <Button type="button" variant="secondary" onClick={handleStepBack} className="w-full sm:w-auto">
                                    Voltar
                                </Button>
                                <Button type="submit" className="w-full sm:w-auto">
                                    Concluir demonstração
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <BookingSummary
                        serviceName={selectedService?.name}
                        durationMinutes={selectedService?.durationMinutes}
                        price={selectedService?.priceValue}
                        dateLabel={selectedDateLabel}
                        time={selectedTime}
                        customerName={customerName}
                        phone={phone}
                        isReviewStep={currentStep === 'review'}
                        isSubmitting={false}
                    />

                    <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                        <div className="space-y-3 sm:space-y-4">
                            <div>
                                <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Contexto demo</p>
                                <h2 className="mt-1.5 text-lg font-semibold text-slate-900 sm:mt-2 sm:text-2xl">
                                    Fluxo visual da reserva
                                </h2>
                            </div>

                            <div className="space-y-2.5 text-sm text-slate-600 sm:space-y-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                                    <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Negócio demo</span>
                                    <span className="mt-1 block font-medium text-slate-900">{demoBusiness.name}</span>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                                    <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Atendimento</span>
                                    <span className="mt-1 block font-medium text-slate-900">{demoBusiness.hoursLabel}</span>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                                    <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Profissional demo</span>
                                    <span className="mt-1 block font-medium text-slate-900">
                                        {selectedProfessional?.name || 'Selecione na etapa 3'}
                                    </span>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                                    <span className="block text-xs uppercase tracking-[.2em] text-slate-500">Aviso</span>
                                    <span className="mt-1 block font-medium text-slate-900">{demoNotice}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </form>
        </main>
    )
}
