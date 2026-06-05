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
    status: 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE'
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
    { time: '09:00', status: 'AVAILABLE' },
    { time: '10:00', status: 'BOOKED' },
    { time: '11:00', status: 'AVAILABLE' },
    { time: '14:00', status: 'AVAILABLE' },
    { time: '15:00', status: 'BOOKED' },
    { time: '16:00', status: 'UNAVAILABLE' },
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
        id: '2026-06-05',
        label: '05/06',
        weekdayLabel: 'Sexta',
        summaryLabel: '05/06/2026',
    },
    {
        id: '2026-06-06',
        label: '06/06',
        weekdayLabel: 'Sábado',
        summaryLabel: '06/06/2026',
    },
    {
        id: '2026-06-07',
        label: '07/06',
        weekdayLabel: 'Domingo',
        summaryLabel: '07/06/2026',
    },
]

export const demoCustomerPreset = {
    name: 'João da Silva',
    phone: '(48) 99999-1234',
}
