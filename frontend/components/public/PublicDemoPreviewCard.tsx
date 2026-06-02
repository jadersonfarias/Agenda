import Link from 'next/link'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

const previewItems = [
    'Serviços cadastrados',
    'Horários disponíveis',
    'Reserva simulada',
] as const

export function PublicDemoPreviewCard() {
    return (
        <Card className="relative flex min-w-0 h-full w-full flex-col overflow-hidden border-purple-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(216,180,254,0.18),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(250,245,255,1)_100%)] p-3.5 shadow-xl shadow-purple-100/70 sm:p-5 lg:p-5">
            <div className="absolute -right-10 top-5 h-24 w-24 rounded-full bg-purple-200/35 blur-3xl" />
            <div className="absolute -left-8 bottom-6 h-20 w-20 rounded-full bg-fuchsia-200/30 blur-3xl" />

            <div className="relative flex min-w-0 h-full flex-col space-y-4">
                <div className="space-y-2.5">
                    <p className="text-xs uppercase tracking-[.25em] text-purple-700 sm:text-sm">Demonstração visual</p>
                    <h2 className="max-w-[18ch] text-2xl font-semibold tracking-tight leading-tight text-slate-950 sm:text-[1.9rem]">
                        Veja como o cliente agenda em poucos passos
                    </h2>
                    <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                        Acesse uma simulação com dados fictícios, sem criar cadastro ou agendamento real.
                    </p>
                </div>

                <div className="rounded-[1.6rem] bg-gradient-to-br from-purple-700 via-violet-700 to-fuchsia-700 p-3.5 text-white shadow-xl shadow-purple-200/70 sm:p-4">
                    <div className="rounded-[1.3rem] border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm sm:p-4">
                        <p className="text-[11px] uppercase tracking-[.22em] text-purple-100">Preview da experiência</p>

                        <div className="mt-3.5 space-y-2.5">
                            {previewItems.map((item) => (
                                <div
                                    key={item}
                                    className="flex min-w-0 items-center gap-3 rounded-[1.05rem] bg-white/10 px-3.5 py-2.5"
                                >
                                    <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-300" />
                                    <span className="truncate text-sm font-medium text-white sm:text-base">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-3.5 rounded-[1.3rem] border border-white/15 bg-white/10 px-3.5 py-3.5 sm:px-4 sm:py-4">
                        <p className="text-xs uppercase tracking-[.2em] text-purple-100">Importante</p>
                        <p className="mt-2 text-sm leading-6 text-purple-50">
                            Esta prévia é apenas visual. A demonstração completa fica em
                            {' '}
                            <span className="font-semibold text-white">/demo</span>.
                        </p>
                    </div>
                </div>

                <Link href="/demo" className="mt-auto block w-full">
                    <Button className="w-full bg-purple-700 py-3 text-base shadow-lg shadow-purple-300/60 hover:bg-purple-800">
                        Abrir demonstração
                    </Button>
                </Link>
            </div>
        </Card>
    )
}
