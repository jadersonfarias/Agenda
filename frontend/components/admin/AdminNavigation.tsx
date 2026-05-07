'use client'

import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Label } from '../ui/label'
import { Select } from '../ui/select'

export const adminSectionOptions = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'appointments', label: 'Agenda' },
    { id: 'services', label: 'Serviços' },
    { id: 'team', label: 'Equipe' },
    { id: 'financial', label: 'Financeiro' },
    { id: 'settings', label: 'Configurações' },
] as const

export type AdminSectionId = (typeof adminSectionOptions)[number]['id']

type AdminNavigationProps = {
    activeSection: AdminSectionId
    onChange: (section: AdminSectionId) => void
}

export function AdminNavigation({ activeSection, onChange }: AdminNavigationProps) {
    return (
        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
            <div className="sm:hidden">
                <Label className="space-y-2">
                    <span className="text-xs uppercase tracking-[.25em] text-slate-500">Seção</span>
                    <Select
                        value={activeSection}
                        onChange={(event) => onChange(event.target.value as AdminSectionId)}
                    >
                        {adminSectionOptions.map((section) => (
                            <option key={section.id} value={section.id}>
                                {section.label}
                            </option>
                        ))}
                    </Select>
                </Label>
            </div>

            <div className="hidden sm:block">
                <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap">
                    {adminSectionOptions.map((section) => (
                        <Button
                            key={section.id}
                            type="button"
                            variant={activeSection === section.id ? 'default' : 'secondary'}
                            onClick={() => onChange(section.id)}
                            className="min-h-12 shrink-0 rounded-full px-4 py-2 text-sm font-semibold lg:min-h-0"
                        >
                            {section.label}
                        </Button>
                    ))}
                </div>
            </div>
        </Card>
    )
}
