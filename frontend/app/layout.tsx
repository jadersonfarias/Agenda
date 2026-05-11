import './globals.css'
import type { Metadata } from 'next'
import { Providers } from '../components/providers'
import { PublicSiteHeader } from '../components/public/PublicSiteHeader'

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
                        <PublicSiteHeader />

                        <main>{children}</main>
                    </div>
                </Providers>
            </body>
        </html>
    )
}
