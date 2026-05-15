'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

type NavigationItem = {
    href: string
    label: string
    external?: boolean
    icon: (className?: string) => JSX.Element
}

function CalendarIcon(className?: string) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
            <path d="M8 3v3M16 3v3M4 9h16" />
            <rect x="4" y="5" width="16" height="15" rx="3" />
        </svg>
    )
}

function ClipboardIcon(className?: string) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 7.5V12l3 1.75" />
        </svg>
    )
}

function UsersIcon(className?: string) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9.5" cy="8" r="3.5" />
            <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M15 4.13a3.5 3.5 0 0 1 0 6.74" />
        </svg>
    )
}

function ShieldIcon(className?: string) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
            <path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3Z" />
        </svg>
    )
}

export function PublicSiteHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const pathname = usePathname()
    const menuRef = useRef<HTMLElement | null>(null)
    const isInvitePage = pathname.startsWith('/invite/')
    const defaultBusinessId = process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_ID || 'default-business'
    const currentBusinessSlug = useMemo(() => {
        const slugMatch = pathname.match(/^\/b\/([^/]+)/)
        return slugMatch?.[1] ?? defaultBusinessId
    }, [pathname, defaultBusinessId])
    const navigationItems: NavigationItem[] = useMemo(() => ([
        { href: '/', label: 'Início', icon: CalendarIcon },
        { href: '/meus-agendamentos', label: 'Meus agendamentos', icon: ClipboardIcon },
        { href: `/b/${encodeURIComponent(currentBusinessSlug)}/agenda`, label: 'Agenda pública', icon: UsersIcon },
    ]), [currentBusinessSlug])
    const accountItems: NavigationItem[] = useMemo(() => ([
        { href: '/admin', label: 'Admin', icon: ShieldIcon },
    ]), [])

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
            <header className="border-b border-slate-200 bg-white/90 py-3 shadow-sm shadow-slate-200/30 backdrop-blur-md sm:py-4">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                    <Link
                        href="/"
                        className="text-base font-semibold text-slate-900 transition hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:text-lg"
                    >
                        Scheduler SaaS
                    </Link>

                    <Link
                        href="/"
                        className="text-xs font-semibold text-slate-500 transition hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:text-sm"
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
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                <Link
                    href="/"
                    className="min-w-0 text-base font-semibold text-slate-900 transition hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:text-lg"
                    onClick={() => setIsMenuOpen(false)}
                >
                    Scheduler SaaS
                </Link>

                <nav className="hidden items-center gap-2 text-sm text-slate-600 lg:flex lg:gap-4">
                    {navigationItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="rounded-full px-3 py-2 transition hover:bg-purple-100 hover:text-purple-700"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden lg:flex lg:items-center">
                    <Link
                        href="/admin"
                        className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:border-purple-300 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    >
                        Acessar admin
                    </Link>
                </div>

                <button
                    type="button"
                    onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-purple-200 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 lg:hidden"
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

            {isMenuOpen ? (
                <div className="absolute right-4 top-[calc(100%+0.75rem)] z-50 w-[min(19rem,calc(100vw-2rem))] sm:right-6 lg:hidden">
                    <div
                        id="public-mobile-menu"
                        className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[1.5rem] border border-purple-100 bg-white px-4 py-4 shadow-2xl shadow-purple-100/70 sm:rounded-[2rem] sm:px-5 sm:py-5"
                    >
                        <div className="absolute -top-2 right-6 h-5 w-5 rotate-45 rounded-[0.7rem] border-l border-t border-purple-100 bg-white" />

                        <div className="relative">
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[.2em] text-purple-700 sm:tracking-[.28em]">Navegação</p>
                                </div>

                                <nav className="flex flex-col">
                                    {navigationItems.map((item, index) => (
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
                                                {item.icon('h-5 w-5 sm:h-6 sm:w-6')}
                                            </span>
                                            <span className="text-base font-semibold text-slate-700 sm:text-[1.05rem]">{item.label}</span>
                                        </Link>
                                    ))}
                                </nav>
                            </div>

                            <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[.2em] text-purple-700 sm:tracking-[.28em]">Conta</p>
                                </div>

                                <nav className="flex flex-col">
                                    {accountItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-3 border-b border-slate-200 py-3 text-left transition hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:gap-4 sm:py-4"
                                        >
                                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-purple-700 sm:h-8 sm:w-8">
                                                {item.icon('h-5 w-5 sm:h-6 sm:w-6')}
                                            </span>
                                            <span className="text-base font-semibold text-slate-700 sm:text-[1.05rem]">{item.label}</span>
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </header>
    )
}
