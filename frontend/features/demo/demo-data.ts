export type DemoService = {
    id: string
    name: string
    priceLabel: string
    priceValue: string
    durationLabel: string
    durationMinutes: number
}

export type DemoScheduleSlot = {
    time: string
    status: 'available' | 'reserved'
}

export type DemoTeamMember = {
    id: string
    name: string
    role: string
}

export type DemoSummaryMetric = {
    label: string
    value: string
}

export type DemoDayOption = {
    id: string
    label: string
    weekdayLabel: string
    summaryLabel: string
}

export const demoBusiness = {
    name: 'Barbearia Demo MarcaCerta',
    hoursLabel: '09:00 às 18:00',
    city: 'Florianópolis/SC',
}

export const demoNotice = 'Esta é uma demonstração com dados fictícios. Nenhum agendamento real será criado.'

export const demoServices: DemoService[] = [
    {
        id: 'corte-masculino',
        name: 'Corte Masculino',
        priceLabel: 'R$ 45,00',
        priceValue: '45',
        durationLabel: '30 min',
        durationMinutes: 30,
    },
    {
        id: 'barba',
        name: 'Barba',
        priceLabel: 'R$ 30,00',
        priceValue: '30',
        durationLabel: '30 min',
        durationMinutes: 30,
    },
    {
        id: 'corte-barba',
        name: 'Corte + Barba',
        priceLabel: 'R$ 70,00',
        priceValue: '70',
        durationLabel: '60 min',
        durationMinutes: 60,
    },
]

export const demoSchedule: DemoScheduleSlot[] = [
    { time: '09:00', status: 'available' },
    { time: '10:00', status: 'reserved' },
    { time: '11:00', status: 'available' },
    { time: '14:00', status: 'available' },
    { time: '15:00', status: 'reserved' },
]

export const demoTeam: DemoTeamMember[] = [
    {
        id: 'carlos',
        name: 'Carlos',
        role: 'Barbeiro',
    },
    {
        id: 'pedro',
        name: 'Pedro',
        role: 'Barbeiro',
    },
]

export const demoSummary: DemoSummaryMetric[] = [
    {
        label: 'Atendimentos hoje',
        value: '4',
    },
    {
        label: 'Profissionais',
        value: '2',
    },
    {
        label: 'Concluído hoje',
        value: 'R$ 145,00',
    },
]

export const demoDays: DemoDayOption[] = [
    {
        id: '2026-06-02',
        label: '02/06',
        weekdayLabel: 'Terça',
        summaryLabel: '02/06/2026',
    },
    {
        id: '2026-06-03',
        label: '03/06',
        weekdayLabel: 'Quarta',
        summaryLabel: '03/06/2026',
    },
    {
        id: '2026-06-04',
        label: '04/06',
        weekdayLabel: 'Quinta',
        summaryLabel: '04/06/2026',
    },
]

export const demoCustomerPreset = {
    name: 'João da Silva',
    phone: '(48) 99999-1234',
}
