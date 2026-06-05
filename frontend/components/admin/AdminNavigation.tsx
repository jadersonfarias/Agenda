'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

export const adminSectionOptions = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'appointments', label: 'Agenda' },
    { id: 'services', label: 'Serviços' },
    { id: 'team', label: 'Equipe' },
    { id: 'financial', label: 'Financeiro' },
    { id: 'settings', label: 'Configurações' },
] as const

export type AdminSectionId = (typeof adminSectionOptions)[number]['id']
export type AdminSectionOption = (typeof adminSectionOptions)[number]

type AdminNavigationProps = {
    activeSection: AdminSectionId
    sections?: readonly AdminSectionOption[]
    onChange: (section: AdminSectionId) => void
}

export function AdminNavigation({
    activeSection,
    sections = adminSectionOptions,
    onChange,
}: AdminNavigationProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const mobileMenuRef = useRef<HTMLDivElement | null>(null)
    const activeSectionLabel =
        sections.find((section) => section.id === activeSection)?.label ?? sections[0]?.label ?? 'Seção'

    useEffect(() => {
        if (!isMobileMenuOpen) {
            return
        }

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            if (!mobileMenuRef.current?.contains(event.target as Node)) {
                setIsMobileMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('touchstart', handlePointerDown)

        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('touchstart', handlePointerDown)
        }
    }, [isMobileMenuOpen])

    return (
        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
            <div className="sm:hidden">
                <div ref={mobileMenuRef} className="relative space-y-2">
                    <span
                        id="admin-mobile-section-label"
                        className="block text-xs font-semibold uppercase tracking-[.25em] text-slate-500"
                    >
                        Seção
                    </span>

                    <button
                        type="button"
                        aria-labelledby="admin-mobile-section-label admin-mobile-section-current"
                        aria-haspopup="listbox"
                        aria-expanded={isMobileMenuOpen}
                        onClick={() => setIsMobileMenuOpen((current) => !current)}
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                                setIsMobileMenuOpen(false)
                            }
                        }}
                        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-purple-200 bg-slate-50 px-4 py-3 text-left shadow-sm shadow-purple-100/70 outline-none transition hover:border-purple-300 hover:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    >
                        <span
                            id="admin-mobile-section-current"
                            className="min-w-0 truncate text-base font-semibold text-slate-950"
                        >
                            {activeSectionLabel}
                        </span>
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            className={[
                                'h-5 w-5 shrink-0 text-purple-600 transition-transform duration-200',
                                isMobileMenuOpen ? 'rotate-180' : 'rotate-0',
                            ].join(' ')}
                            fill="none"
                        >
                            <path
                                d="M5 7.5L10 12.5L15 7.5"
                                stroke="currentColor"
                                strokeWidth="1.9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    {isMobileMenuOpen ? (
                        <div
                            role="listbox"
                            aria-labelledby="admin-mobile-section-label"
                            className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-purple-100 bg-white p-1.5 shadow-xl shadow-slate-200/80"
                        >
                            {sections.map((section) => {
                                const isSelected = activeSection === section.id

                                return (
                                    <button
                                        key={section.id}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => {
                                            onChange(section.id)
                                            setIsMobileMenuOpen(false)
                                        }}
                                        className={[
                                            'flex min-h-12 w-full items-center rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition',
                                            isSelected
                                                ? 'border-purple-200 bg-purple-50 text-purple-700'
                                                : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-950',
                                        ].join(' ')}
                                    >
                                        {section.label}
                                    </button>
                                )
                            })}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="hidden sm:block">
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap">
                    {sections.map((section) => (
                        <Button
                            key={section.id}
                            type="button"
                            variant={activeSection === section.id ? 'default' : 'secondary'}
                            onClick={() => onChange(section.id)}
                            className="min-h-12 shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold lg:min-h-0 lg:px-4"
                        >
                            {section.label}
                        </Button>
                    ))}
                </div>
            </div>
        </Card>
    )
}
