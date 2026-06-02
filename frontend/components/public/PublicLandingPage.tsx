import Link from 'next/link'
import { PublicDemoPreviewCard } from './PublicDemoPreviewCard'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

const benefits = [
    {
        title: 'Receba reservas online',
        description: 'Deixe seu link público ativo para clientes agendarem sem troca manual de mensagens.',
        highlight: 'Link público disponível para o cliente reservar quando quiser.',
    },
    {
        title: 'Organize agenda e equipe',
        description: 'Controle serviços, horários, funcionários e atendimentos em um painel simples.',
        highlight: 'Mais clareza para o dia a dia sem depender de planilhas ou conversas soltas.',
    },
    {
        title: 'Acompanhe faturamento',
        description: 'Veja atendimentos concluídos, ticket médio e movimentação mensal.',
        highlight: 'Tenha visão rápida do que já entrou e do ritmo do seu negócio.',
    },
] as const

const steps = [
    {
        title: 'Crie sua conta',
        description: 'Comece em poucos minutos com um cadastro simples.',
    },
    {
        title: 'Cadastre seus serviços',
        description: 'Organize os atendimentos e defina os horários do negócio.',
    },
    {
        title: 'Compartilhe seu link',
        description: 'Envie sua agenda online para clientes no Instagram, bio e WhatsApp.',
    },
    {
        title: 'Receba agendamentos',
        description: 'Deixe o cliente reservar enquanto você foca no atendimento.',
    },
] as const

const idealFor = [
    {
        title: 'Salões de beleza',
        description: 'Agenda com mais organização para rotina de atendimento e equipe.',
    },
    {
        title: 'Barbearias',
        description: 'Mais praticidade para encaixes, horários e agenda do dia.',
    },
    {
        title: 'Estética',
        description: 'Controle de serviços e atendimentos em um painel claro.',
    },
    {
        title: 'Studios',
        description: 'Boa opção para negócios que trabalham com hora marcada.',
    },
    {
        title: 'Profissionais autônomos',
        description: 'Uma agenda profissional para vender melhor seu tempo.',
    },
] as const

const heroBadges = [
    'Reservas online',
    'Gestão simples',
    'Mobile first',
] as const

const heroFeatureCards = [
    {
        eyebrow: 'Reserva',
        text: 'Seu link de agendamento pronto para receber clientes',
    },
    {
        eyebrow: 'Equipe',
        text: 'Mais controle da operação sem complicar o dia a dia',
    },
    {
        eyebrow: 'Financeiro',
        text: 'Visão rápida do movimento do negócio',
    },
] as const

export function PublicLandingPage() {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 overflow-x-hidden px-3 py-4 sm:gap-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-5">
                <Card className="relative min-w-0 h-full w-full overflow-hidden border-purple-200 bg-gradient-to-br from-white via-purple-50/60 to-purple-100/70 shadow-xl shadow-purple-100/70">
                    <div className="absolute -right-14 top-6 h-32 w-32 rounded-full bg-purple-200/40 blur-3xl" />
                    <div className="absolute -left-10 bottom-6 h-24 w-24 rounded-full bg-fuchsia-200/40 blur-3xl" />

                    <div className="relative flex h-full min-w-0 flex-col gap-6 sm:gap-7">
                        <div className="space-y-5 sm:space-y-6">
                            <div className="space-y-4 sm:space-y-5">
                                <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">MarcaCerta</p>
                                <div className="inline-flex rounded-full border border-purple-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.18em] text-purple-700 sm:text-xs">
                                    Agenda online para negócios de atendimento
                                </div>
                                <h1 className="max-w-[12ch] text-[2.05rem] font-semibold tracking-tight leading-tight text-slate-950 sm:max-w-[13ch] sm:text-[2.7rem] lg:max-w-[11.5ch] lg:text-[3.7rem]">
                                    Receba <span className="text-purple-700">agendamentos online</span> sem depender do WhatsApp
                                </h1>
                                <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7 lg:max-w-2xl lg:text-lg lg:leading-8">
                                    Receba reservas online, organize sua agenda e acompanhe seus atendimentos em um só painel.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2.5 text-sm text-slate-600">
                                {heroBadges.map((badge) => (
                                    <span
                                        key={badge}
                                        className="rounded-full border border-white/80 bg-white/90 px-3 py-2 font-medium shadow-sm shadow-purple-100/60"
                                    >
                                        {badge}
                                    </span>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:gap-4">
                                <Link href="/signup" className="w-full sm:w-auto">
                                    <Button className="w-full bg-purple-700 px-6 py-3 text-base shadow-lg shadow-purple-300/60 hover:bg-purple-800 sm:min-w-[190px]">
                                        Começar grátis
                                    </Button>
                                </Link>
                                <Link href="/demo" className="w-full sm:w-auto">
                                    <Button variant="secondary" className="w-full border border-purple-200 bg-white/90 px-6 py-3 text-base text-purple-700 hover:bg-purple-50 sm:min-w-[180px]">
                                        Ver demonstração
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:mt-auto">
                            {heroFeatureCards.map((item) => (
                                <div
                                    key={item.eyebrow}
                                    className="flex h-full flex-col rounded-[1.75rem] border border-white/80 bg-white/90 px-4 py-4 shadow-sm shadow-purple-100/80"
                                >
                                    <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">{item.eyebrow}</p>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-950 sm:text-base">
                                        {item.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <PublicDemoPreviewCard />
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                {benefits.map((benefit) => (
                    <Card key={benefit.title} className="border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                        <div className="space-y-4">
                            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-sm font-semibold text-purple-700">
                                0{benefits.indexOf(benefit) + 1}
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">{benefit.title}</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{benefit.description}</p>
                            </div>
                            <div className="rounded-[1.4rem] border border-purple-100 bg-purple-50/70 px-4 py-4">
                                <p className="text-sm font-medium leading-6 text-slate-700">{benefit.highlight}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <Card className="border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                    <div className="space-y-5">
                        <div>
                            <p className="text-xs uppercase tracking-[.25em] text-purple-700 sm:text-sm">Como funciona</p>
                            <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
                                Um passo a passo simples para colocar sua agenda no ar
                            </h2>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {steps.map((step, index) => (
                                <div
                                    key={step.title}
                                    className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-700 text-sm font-semibold text-white shadow-md shadow-purple-200/70">
                                            {index + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-base font-semibold text-slate-950 sm:text-lg">{step.title}</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden border-purple-300/30 bg-gradient-to-br from-[#140a2f] via-[#221047] to-[#4a167c] text-white shadow-xl shadow-purple-300/30">
                    <div className="absolute -right-12 top-8 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" />
                    <div className="absolute -left-10 bottom-8 h-36 w-36 rounded-full bg-violet-400/20 blur-3xl" />

                    <div className="relative space-y-5">
                        <div>
                            <p className="text-xs uppercase tracking-[.25em] text-fuchsia-200 sm:text-sm">Ideal para</p>
                            <h2 className="mt-2 text-xl font-semibold sm:text-2xl">Feito para negócios que precisam vender melhor o tempo da agenda</h2>
                        </div>

                        <div className="grid gap-3">
                            {idealFor.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-[1.5rem] border border-white/12 bg-gradient-to-r from-white/8 to-fuchsia-300/10 px-4 py-4 backdrop-blur-sm"
                                >
                                    <p className="text-base font-semibold text-white">{item.title}</p>
                                    <p className="mt-2 text-sm leading-6 text-purple-100">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </section>

            <section>
                <Card className="overflow-hidden border-purple-200 bg-gradient-to-r from-purple-700 via-purple-700 to-violet-700 text-white shadow-xl shadow-purple-200/70">
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="absolute -right-12 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-pink-300/10 blur-3xl" />

                        <div className="relative space-y-2">
                            <p className="text-xs uppercase tracking-[.25em] text-purple-100 sm:text-sm">Comece hoje</p>
                            <h2 className="text-2xl font-semibold sm:text-3xl">Comece hoje e publique sua agenda em poucos minutos</h2>
                            <p className="max-w-2xl text-sm leading-6 text-purple-50 sm:text-base">
                                Crie sua conta, cadastre seus serviços e compartilhe seu link com seus clientes.
                            </p>
                        </div>

                        <div className="relative flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:w-auto">
                            <Link href="/signup" className="w-full sm:w-auto">
                                <Button
                                    variant="secondary"
                                    className="w-full border border-white/20 bg-white px-6 text-purple-700 hover:bg-purple-50 sm:min-w-[190px]"
                                >
                                    Começar grátis
                                </Button>
                            </Link>
                            <Link href="/demo" className="w-full sm:w-auto">
                                <Button
                                    className="w-full border border-white/25 bg-transparent px-6 text-white hover:bg-white/10 sm:min-w-[180px]"
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
