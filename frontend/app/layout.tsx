import './globals.css'
import type { Metadata } from 'next'
import { Providers } from '../components/providers'
import { PublicSiteHeader } from '../components/public/PublicSiteHeader'

export const metadata: Metadata = {
    title: 'MarcaCerta',
    description: 'MarcaCerta é uma plataforma de agendamento com reservas online, disponibilidade e gestão de serviços.',
    icons: {
        icon: '/favicon.png',
        shortcut: '/favicon.png',
        apple: '/favicon.png',
    },
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
