import Link from 'next/link'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

type PublicLandingPageProps = {
    demoBookingHref: string
    demoBusinessName: string
    demoBusinessHoursLabel?: string
}

const benefits = [
    {
        title: 'Receba reservas online',
        description: 'Abra sua agenda para clientes 24 horas por dia e reduza o vai e volta de mensagens para confirmar horários.',
    },
    {
        title: 'Organize agenda e equipe',
        description: 'Mantenha serviços, horários, equipe e agenda do negócio organizados em um painel simples de usar.',
    },
    {
        title: 'Acompanhe faturamento',
        description: 'Tenha uma visão rápida dos atendimentos concluídos e acompanhe o ritmo do negócio sem planilhas soltas.',
    },
] as const

const steps = [
    'Crie sua conta',
    'Cadastre seus serviços',
    'Compartilhe seu link',
    'Receba agendamentos',
] as const

const idealFor = [
    'Salões de beleza',
    'Barbearias',
    'Estética',
    'Studios',
    'Profissionais autônomos',
] as const

export function PublicLandingPage({
    demoBookingHref,
    demoBusinessName,
    demoBusinessHoursLabel,
}: PublicLandingPageProps) {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 overflow-x-hidden px-3 py-4 sm:gap-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-6">
                <Card className="border-purple-200 bg-gradient-to-br from-white via-white to-purple-50">
                    <div className="space-y-4 sm:space-y-6">
                        <div className="space-y-3">
                            <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Scheduler SaaS</p>
                            <h1 className="max-w-3xl text-[1.95rem] font-semibold leading-tight text-slate-900 sm:text-4xl lg:text-[3.2rem]">
                                Agenda online para salões, barbearias e pequenos negócios
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                Receba reservas online, organize sua agenda e acompanhe seus atendimentos em um só painel.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold uppercase tracking-[.18em] text-purple-700">
                                Agenda pública
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[.18em] text-slate-700">
                                Gestão simples
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[.18em] text-slate-700">
                                Mobile first
                            </span>
                        </div>

                        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                            <Link href="/signup" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto">Começar agora</Button>
                            </Link>
                            <Link href={demoBookingHref} className="w-full sm:w-auto">
                                <Button variant="secondary" className="w-full sm:w-auto">
                                    Ver demonstração
                                </Button>
                            </Link>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-3xl border border-slate-200 bg-white/90 px-4 py-4">
                                <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Reserva</p>
                                <p className="mt-2 text-sm font-semibold text-slate-900 sm:text-base">Seu link de agendamento pronto para receber clientes</p>
                            </div>
                            <div className="rounded-3xl border border-slate-200 bg-white/90 px-4 py-4">
                                <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Equipe</p>
                                <p className="mt-2 text-sm font-semibold text-slate-900 sm:text-base">Mais controle da operação sem complicar o dia a dia</p>
                            </div>
                            <div className="rounded-3xl border border-slate-200 bg-white/90 px-4 py-4">
                                <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Financeiro</p>
                                <p className="mt-2 text-sm font-semibold text-slate-900 sm:text-base">Visão rápida do movimento do negócio</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[.25em] text-purple-700 sm:text-sm">Demonstração ao vivo</p>
                            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{demoBusinessName}</h2>
                            <p className="text-sm leading-6 text-slate-600">
                                Veja uma agenda pública funcionando antes de criar sua conta e entenda como o cliente reserva em poucos passos.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                                <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Link demo</p>
                                <p className="mt-2 break-all text-sm font-semibold text-slate-900">{demoBookingHref}</p>
                            </div>
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                                <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Funcionamento</p>
                                <p className="mt-2 text-sm font-semibold text-slate-900 sm:text-base">
                                    {demoBusinessHoursLabel ?? 'Horários configurados no painel admin'}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-dashed border-purple-200 bg-purple-50/70 px-4 py-4">
                            <p className="text-[11px] uppercase tracking-[.2em] text-purple-700">Dica</p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                                Abra a demonstração no celular para sentir melhor a experiência que seus clientes terão ao agendar.
                            </p>
                        </div>
                    </div>
                </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Card className="border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-[.25em] text-purple-700 sm:text-sm">Benefícios</p>
                            <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Tudo que você precisa para vender melhor seu atendimento</h2>
                        </div>

                        <div className="grid gap-3">
                            {benefits.map((benefit) => (
                                <div key={benefit.title} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{benefit.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{benefit.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card className="border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-[.25em] text-purple-700 sm:text-sm">Como funciona</p>
                            <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Configuração simples para começar rápido</h2>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {steps.map((step, index) => (
                                <div key={step} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
                                            {index + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-base font-semibold text-slate-900 sm:text-lg">{step}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </section>

            <section>
                <Card className="border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-[.25em] text-purple-700 sm:text-sm">Ideal para</p>
                            <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Feito para negócios que vivem de agenda organizada</h2>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            {idealFor.map((item) => (
                                <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <p className="text-sm font-semibold text-slate-900 sm:text-base">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </section>

            <section>
                <Card className="border-purple-200 bg-gradient-to-r from-purple-700 via-purple-700 to-violet-700 text-white shadow-lg shadow-purple-200/70">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[.25em] text-purple-100 sm:text-sm">Comece hoje</p>
                            <h2 className="text-2xl font-semibold sm:text-3xl">Coloque seu negócio para receber reservas online</h2>
                            <p className="max-w-2xl text-sm leading-6 text-purple-50 sm:text-base">
                                Crie sua conta, publique sua agenda e compartilhe o link com seus clientes em poucos minutos.
                            </p>
                        </div>

                        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:w-auto">
                            <Link href="/signup" className="w-full sm:w-auto">
                                <Button
                                    variant="secondary"
                                    className="w-full border border-white/20 bg-white text-purple-700 hover:bg-purple-50 sm:w-auto"
                                >
                                    Começar agora
                                </Button>
                            </Link>
                            <Link href={demoBookingHref} className="w-full sm:w-auto">
                                <Button
                                    className="w-full border border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                                >
                                    Ver demonstração
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </section>
        </main>
    )
}
