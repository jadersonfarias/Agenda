import './globals.css'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Providers } from '../components/providers'

export const metadata: Metadata = {
    title: 'Scheduler SaaS',
    description: 'Plataforma de agendamento multi-negócio com login, disponibilidade e gestão de serviços.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR">
            <body className="min-h-screen bg-secondary text-slate-900">
                <Providers>
                    <div className="min-h-screen bg-secondary text-slate-900">
                        <header className="border-b border-slate-200 bg-white/90 py-4 shadow-sm shadow-slate-200/30 backdrop-blur-md">
                            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                                <div className="text-lg font-semibold text-slate-900">Scheduler SaaS</div>
                                <nav className="flex gap-2 text-sm text-slate-600 sm:gap-4">
                                    <Link href="/" className="rounded-full px-3 py-2 transition hover:bg-purple-100 hover:text-purple-700">
                                        Reservar
                                    </Link>
                                    <Link href="/meus-agendamentos" className="rounded-full px-3 py-2 transition hover:bg-purple-100 hover:text-purple-700">
                                        Meus agendamentos
                                    </Link>
                                    <Link href="/admin" className="rounded-full px-3 py-2 transition hover:bg-purple-100 hover:text-purple-700">
                                        Admin
                                    </Link>
                                </nav>
                            </div>
                        </header>

                        <main>{children}</main>
                    </div>
                </Providers>
            </body>
        </html>
    )
}
