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

const quickHighlights = [
    {
        title: 'Link de agendamento',
        description: 'Divulgue online sua agenda com uma página pronta para receber reservas.',
    },
    {
        title: 'Painel simples',
        description: 'Organize agenda, equipe e serviços sem complicar a rotina do negócio.',
    },
    {
        title: 'Resumo do movimento',
        description: 'Acompanhe o que acontece no negócio em um só lugar, com mais clareza.',
    },
] as const

export function PublicLandingPage({
    demoBookingHref,
    demoBusinessName,
    demoBusinessHoursLabel,
}: PublicLandingPageProps) {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 overflow-x-hidden px-3 py-4 sm:gap-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:gap-6">
                <Card className="relative overflow-hidden border-purple-200 bg-gradient-to-br from-white via-purple-50/60 to-purple-100/70 shadow-xl shadow-purple-100/70">
                    <div className="absolute -right-14 top-6 h-32 w-32 rounded-full bg-purple-200/40 blur-3xl" />
                    <div className="absolute -left-10 bottom-6 h-24 w-24 rounded-full bg-fuchsia-200/40 blur-3xl" />

                    <div className="relative space-y-7 sm:space-y-8">
                        <div className="space-y-4 sm:space-y-5">
                            <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">MarcaCerta</p>
                            <div className="inline-flex rounded-full border border-purple-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.18em] text-purple-700 sm:text-xs">
                                Agenda online para negócios de atendimento
                            </div>
                            <h1 className="max-w-[12ch] text-[1.85rem] font-semibold tracking-tight leading-[1.08] text-slate-950 sm:max-w-[13ch] sm:text-[2.5rem] sm:leading-[1.04] lg:max-w-[12ch] lg:text-[3.85rem] lg:leading-[0.98]">
                                Receba <span className="text-purple-700">agendamentos online</span> sem depender do WhatsApp o dia todo
                            </h1>
                            <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7 lg:max-w-2xl lg:text-lg lg:leading-8">
                                Organize serviços, equipe, agenda e faturamento em um painel simples para o dia a dia do seu negócio.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:gap-4">
                            <Link href="/signup" className="w-full sm:w-auto">
                                <Button className="w-full bg-purple-700 px-6 py-3 text-base shadow-lg shadow-purple-300/60 hover:bg-purple-800 sm:min-w-[190px]">
                                    Começar grátis
                                </Button>
                            </Link>
                            <Link href={demoBookingHref} className="w-full sm:w-auto">
                                <Button variant="secondary" className="w-full border border-purple-200 bg-white/90 px-6 py-3 text-base text-purple-700 hover:bg-purple-50 sm:min-w-[180px]">
                                    Ver demonstração
                                </Button>
                            </Link>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[1.75rem] border border-white/80 bg-white/90 px-4 py-4 shadow-sm shadow-purple-100/80">
                                <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Atendimento</p>
                                <p className="mt-2 text-sm font-semibold text-slate-950 sm:text-base">
                                    Clientes reservam mesmo fora do horário comercial
                                </p>
                            </div>
                            <div className="rounded-[1.75rem] border border-white/80 bg-white/90 px-4 py-4 shadow-sm shadow-purple-100/80">
                                <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Operação</p>
                                <p className="mt-2 text-sm font-semibold text-slate-950 sm:text-base">
                                    Serviços, equipe e agenda organizados em um só painel
                                </p>
                            </div>
                            <div className="rounded-[1.75rem] border border-white/80 bg-white/90 px-4 py-4 shadow-sm shadow-purple-100/80">
                                <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Visão</p>
                                <p className="mt-2 text-sm font-semibold text-slate-950 sm:text-base">
                                    Acompanhe atendimentos concluídos e movimento mensal
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 rounded-[1.75rem] border border-purple-200/70 bg-white/75 p-4 sm:grid-cols-3">
                            {quickHighlights.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-[1.5rem] border border-purple-100 bg-gradient-to-br from-white to-purple-50/60 px-4 py-4 shadow-sm shadow-purple-100/60"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 inline-flex h-4 w-4 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-sm shadow-purple-300/70" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-950 sm:text-base">{item.title}</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card className="border-slate-200 bg-white shadow-xl shadow-slate-200/60">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[.25em] text-purple-700 sm:text-sm">Demonstração ao vivo</p>
                            <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">Veja um preview real da experiência do cliente</h2>
                            <p className="text-sm leading-6 text-slate-600">
                                Abra a agenda demo e veja como seu negócio pode receber reservas online com uma página simples, rápida e pronta para divulgar.
                            </p>
                        </div>

                        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-3 shadow-inner shadow-slate-200/70">
                            <div className="rounded-[1.7rem] border border-purple-200 bg-white p-4 shadow-lg shadow-purple-100/60">
                                <div className="flex items-center gap-2 pb-4">
                                    <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                                    <div className="ml-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
                                        Preview da agenda pública
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-[1.5rem] bg-gradient-to-br from-purple-700 to-violet-700 px-4 py-4 text-white shadow-lg shadow-purple-200/70">
                                        <p className="text-[11px] uppercase tracking-[.18em] text-purple-100">Negócio demo</p>
                                        <p className="mt-2 text-lg font-semibold">{demoBusinessName}</p>
                                        <p className="mt-2 text-sm leading-6 text-purple-50">
                                            Página de agendamento pronta para clientes escolherem serviço, horário e confirmarem a reserva.
                                        </p>
                                    </div>

                                    <div className="grid gap-3">
                                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                                            <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Link demo</p>
                                            <p className="mt-2 break-all text-sm font-semibold text-slate-950">{demoBookingHref}</p>
                                        </div>

                                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                                            <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Horário de funcionamento</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-950 sm:text-base">
                                                {demoBusinessHoursLabel ?? 'Horários configurados no painel admin'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-[1.4rem] border border-dashed border-purple-200 bg-purple-50 px-4 py-4">
                                        <p className="text-[11px] uppercase tracking-[.2em] text-purple-700">O que você vai ver</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-700">
                                            Um fluxo real de reserva online para sentir como seus clientes agendam sem precisar ficar chamando no WhatsApp.
                                        </p>
                                    </div>

                                    <Link href={demoBookingHref} className="mt-5 block w-full">
                                        <Button className="w-full bg-purple-700 py-3 text-base hover:bg-purple-800">
                                            Abrir demonstração
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
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
                            <Link href={demoBookingHref} className="w-full sm:w-auto">
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
