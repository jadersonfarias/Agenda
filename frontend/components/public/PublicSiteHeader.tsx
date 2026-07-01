'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Home, ShieldCheck, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const pathname = usePathname()
    const menuRef = useRef<HTMLElement | null>(null)
    const isInvitePage = pathname.startsWith('/invite/')

    useEffect(() => {
        function handlePointerDown(event: MouseEvent) {
            if (!menuRef.current?.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsMenuOpen(false)
            }
        }

        if (isMenuOpen && !isInvitePage) {
            document.addEventListener('mousedown', handlePointerDown)
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isInvitePage, isMenuOpen])

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
        <header
            ref={menuRef}
            className="relative z-50 border-b border-slate-200 bg-white/90 py-3 shadow-sm shadow-slate-200/30 backdrop-blur-md sm:py-4"
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:hidden">
                <Link
                    href="/"
                    className="inline-flex min-w-0 items-center transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="MarcaCerta"
                >
                    <Image
                        src="/marcacerta-logo.png"
                        alt="MarcaCerta"
                        width={1400}
                        height={260}
                        priority
                        className="h-auto w-[150px] sm:w-[190px]"
                    />
                </Link>

                <button
                    type="button"
                    onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-purple-200 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                    aria-expanded={isMenuOpen}
                    aria-controls="public-mobile-menu"
                >
                    <span className="sr-only">{isMenuOpen ? 'Fechar menu' : 'Abrir menu'}</span>
                    <span className="flex flex-col items-center justify-center gap-1.5">
                        <span
                            className={cn(
                                'block h-0.5 w-5 rounded-full bg-current transition-transform',
                                isMenuOpen && 'translate-y-2 rotate-45'
                            )}
                        />
                        <span
                            className={cn(
                                'block h-0.5 w-5 rounded-full bg-current transition-opacity',
                                isMenuOpen && 'opacity-0'
                            )}
                        />
                        <span
                            className={cn(
                                'block h-0.5 w-5 rounded-full bg-current transition-transform',
                                isMenuOpen && '-translate-y-2 -rotate-45'
                            )}
                        />
                    </span>
                </button>
            </div>

            <div className="hidden w-full grid-cols-[1fr_auto_1fr] items-center gap-6 px-8 lg:grid">
                <Link
                    href="/"
                    className="col-start-1 inline-flex min-w-0 w-fit items-center rounded-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                    aria-label="MarcaCerta"
                >
                    <Image
                        src="/marcacerta-logo.png"
                        alt="MarcaCerta"
                        width={1400}
                        height={260}
                        priority
                        className="h-auto w-[190px]"
                    />
                </Link>

                <nav
                    aria-label="Navegação principal"
                    className="col-start-2 flex min-w-0 items-center justify-center gap-2 text-sm"
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
                                    'relative inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
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

                <div className="col-start-3 flex justify-end">
                    <Link
                        href="/admin"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-purple-200 transition hover:-translate-y-0.5 hover:from-purple-800 hover:to-violet-700 hover:shadow-lg hover:shadow-purple-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                    >
                        <ShieldCheck className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                        <span className="whitespace-nowrap">Acessar admin</span>
                    </Link>
                </div>
            </div>

            {isMenuOpen ? (
                <div className="absolute right-4 top-[calc(100%+0.75rem)] z-50 w-[min(19rem,calc(100vw-2rem))] sm:right-6 lg:hidden">
                    <div
                        id="public-mobile-menu"
                        className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[1.5rem] border border-purple-100 bg-white px-4 py-4 shadow-2xl shadow-purple-100/70 sm:rounded-[2rem] sm:px-5 sm:py-5"
                    >
                        <div className="absolute -top-2 right-6 h-5 w-5 rotate-45 rounded-[0.7rem] border-l border-t border-purple-100 bg-white" />

                        <div className="relative">
                            <div className="space-y-3 sm:space-y-4">
                                <p className="text-xs font-semibold uppercase tracking-[.2em] text-purple-700 sm:tracking-[.28em]">
                                    Navegação
                                </p>

                                <nav className="flex flex-col">
                                    {navigationItems.map((item, index) => {
                                        const Icon = item.icon

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className={cn(
                                                    'flex items-center gap-3 py-3 text-left transition hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:gap-4 sm:py-4',
                                                    index < navigationItems.length - 1 && 'border-b border-slate-200'
                                                )}
                                            >
                                                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-purple-700 sm:h-8 sm:w-8">
                                                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                                                </span>
                                                <span className="text-base font-semibold text-slate-700 sm:text-[1.05rem]">
                                                    {item.label}
                                                </span>
                                            </Link>
                                        )
                                    })}
                                </nav>
                            </div>

                            <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
                                <p className="text-xs font-semibold uppercase tracking-[.2em] text-purple-700 sm:tracking-[.28em]">
                                    Conta
                                </p>

                                <Link
                                    href="/admin"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 border-b border-slate-200 py-3 text-left transition hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:gap-4 sm:py-4"
                                >
                                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-purple-700 sm:h-8 sm:w-8">
                                        <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                                    </span>
                                    <span className="text-base font-semibold text-slate-700 sm:text-[1.05rem]">
                                        Admin
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </header>
    )
}
