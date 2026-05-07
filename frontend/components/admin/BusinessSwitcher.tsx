'use client'

import { type AdminBusinessOption } from '../../features/admin/types'
import { Label } from '../ui/label'
import { Select } from '../ui/select'

type BusinessSwitcherProps = {
    businesses: AdminBusinessOption[]
    currentBusinessId: string
    disabled?: boolean
    onChange: (businessId: string) => void
}

export function BusinessSwitcher({ businesses, currentBusinessId, disabled = false, onChange }: BusinessSwitcherProps) {
    if (businesses.length <= 1) {
        return null
    }

    return (
        <Label className="space-y-2">
            <span className="text-xs uppercase tracking-[.2em] text-slate-500">Negócio atual</span>
            <Select value={currentBusinessId} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
                {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                        {business.name} ({business.role})
                    </option>
                ))}
            </Select>
        </Label>
    )
}
