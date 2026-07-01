'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Home, ShieldCheck, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

type NavigationItem = {
    href: string
    label: string
    icon: LucideIcon
}

const navigationItems: NavigationItem[] = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/meus-agendamentos', label: 'Meus agendamentos', icon: CalendarDays },
]

export function PublicSiteHeader() {
    const pathname = usePathname()
    const isInvitePage = pathname.startsWith('/invite/')

    if (isInvitePage) {
        return (
            <header className="relative z-50 border-b border-slate-200 bg-white/90 py-3 shadow-sm shadow-slate-200/30 backdrop-blur-md sm:py-4">
                <div className="flex w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                    <Link
                        href="/"
                        className="inline-flex items-center rounded-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                        aria-label="MarcaCerta"
                    >
                        <Image
                            src="/marcacerta-logo.png"
                            alt="MarcaCerta"
                            width={1400}
                            height={260}
                            priority
                            className="h-auto w-[145px] sm:w-[180px]"
                        />
                    </Link>

                    <Link
                        href="/"
                        className="rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 transition hover:bg-purple-50 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 sm:px-3 sm:text-sm"
                    >
                        Voltar para início
                    </Link>
                </div>
            </header>
        )
    }

    return (
        <header className="relative z-50 border-b border-slate-200 bg-white/90 py-3 shadow-sm shadow-slate-200/30 backdrop-blur-md sm:py-4">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-[1fr_auto] items-center gap-3 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
                    <Link
                        href="/"
                        className="col-start-1 row-start-1 inline-flex min-w-0 w-fit items-center rounded-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                        aria-label="MarcaCerta"
                    >
                        <Image
                            src="/marcacerta-logo.png"
                            alt="MarcaCerta"
                            width={1400}
                            height={260}
                            priority
                            className="h-auto w-[140px] sm:w-[175px] lg:w-[190px]"
                        />
                    </Link>

                    <nav
                        aria-label="Navegação principal"
                        className="col-span-2 col-start-1 row-start-2 flex min-w-0 items-center justify-center gap-1 border-t border-slate-100 pt-2.5 text-sm sm:gap-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:border-0 lg:pt-0"
                    >
                        {navigationItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={cn(
                                        'relative inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 sm:px-4 lg:min-h-11 lg:rounded-2xl',
                                        isActive
                                            ? 'bg-purple-50 text-purple-700'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-purple-700'
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'h-[18px] w-[18px] shrink-0',
                                            isActive ? 'text-purple-600' : 'text-slate-500'
                                        )}
                                        aria-hidden="true"
                                    />
                                    <span className="whitespace-nowrap">{item.label}</span>
                                    {isActive ? (
                                        <span
                                            className="absolute -bottom-1 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-purple-600"
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="col-start-2 row-start-1 flex justify-end lg:col-start-3">
                        <Link
                            href="/admin"
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-purple-200 transition hover:-translate-y-0.5 hover:from-purple-800 hover:to-violet-700 hover:shadow-lg hover:shadow-purple-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 sm:px-4 lg:min-h-11 lg:rounded-2xl lg:px-5"
                        >
                            <ShieldCheck className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                            <span className="sm:hidden">Admin</span>
                            <span className="hidden whitespace-nowrap sm:inline">Acessar admin</span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}
