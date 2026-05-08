import Link from 'next/link'
import { Card } from '../ui/card'

type AppointmentCard = {
    id: string
    scheduledAt: string
    service: {
        name: string
    }
    customer: {
        name: string
    }
}

type PublicAgendaPageProps = {
    businessSlug: string
    headline: string
    appointments: AppointmentCard[]
    errorMessage?: string
}

function getFirstName(name: string) {
    const [firstName] = name.trim().split(/\s+/)
    return firstName || 'Cliente'
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

function formatTime(date: string) {
    return new Date(date).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function PublicAgendaPage({
    businessSlug,
    headline,
    appointments,
    errorMessage,
}: PublicAgendaPageProps) {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 overflow-x-hidden px-4 py-5 sm:gap-6 sm:px-6 sm:py-7 lg:px-8 lg:py-10">
            <Card className="border-purple-100 bg-white shadow-sm shadow-purple-100/40">
                <div className="space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-xs uppercase tracking-[.3em] text-violet-700 sm:text-sm">Agenda pública</p>
                        <h1 className="text-[1.75rem] font-semibold leading-tight text-slate-900 sm:text-3xl lg:text-[2rem]">
                            {headline || 'Agenda pública'}
                        </h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                            Confira os próximos horários reservados deste negócio com visualização pública e discreta.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="w-fit rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 sm:text-sm">
                            {appointments.length} agendamentos
                        </span>

                        <Link
                            href={`/b/${encodeURIComponent(businessSlug)}`}
                            className="inline-flex text-sm font-medium text-purple-700 transition hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-200"
                        >
                            Fazer reserva
                        </Link>
                    </div>
                </div>
            </Card>

            {errorMessage ? (
                <Card className="border-red-200 bg-red-50 shadow-sm shadow-red-100/40">
                    <p className="text-sm font-medium text-red-700">{errorMessage}</p>
                </Card>
            ) : null}

            {!errorMessage && appointments.length === 0 ? (
                <Card className="border-slate-200 bg-white shadow-sm shadow-slate-100">
                    <p className="text-sm text-slate-600 sm:text-base">Nenhum agendamento público encontrado no momento.</p>
                </Card>
            ) : null}

            {!errorMessage && appointments.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {appointments.map((appointment) => (
                        <Card key={appointment.id} className="border-slate-200 bg-white shadow-sm shadow-slate-100 sm:p-5 lg:p-6">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.18em] text-purple-700">
                                        {appointment.service.name}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-xs uppercase tracking-[.18em] text-slate-400">Cliente</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">
                                        {getFirstName(appointment.customer.name)}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] uppercase tracking-[.18em] text-slate-400">Data</p>
                                    <p className="mt-1 text-base font-semibold text-slate-900">
                                        {formatDate(appointment.scheduledAt)}
                                    </p>
                                    <p className="mt-2 text-[11px] uppercase tracking-[.18em] text-slate-400">Horário</p>
                                    <p className="mt-1 text-base font-semibold text-purple-700">
                                        {formatTime(appointment.scheduledAt)}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </section>
            ) : null}
        </main>
    )
}
