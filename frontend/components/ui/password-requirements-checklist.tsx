import { getPasswordRequirements, passwordRequirementItems } from '../../lib/password-validation'
import { cn } from '../../lib/utils'

type PasswordRequirementsChecklistProps = {
    password: string
    className?: string
}

function RequirementIndicator({ met }: { met: boolean }) {
    if (met) {
        return (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-emerald-600 bg-emerald-600 text-white">
                <svg viewBox="0 0 16 16" aria-hidden="true" className="h-2.5 w-2.5 fill-none stroke-current stroke-[2.25]">
                    <path d="M3.5 8.5 6.5 11.5 12.5 5.5" />
                </svg>
            </span>
        )
    }

    return (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        </span>
    )
}

export function PasswordRequirementsChecklist({ password, className }: PasswordRequirementsChecklistProps) {
    const requirements = getPasswordRequirements(password)

    return (
        <ul className={cn('grid gap-1 text-xs leading-5 sm:grid-cols-2', className)}>
            {passwordRequirementItems.map((requirement) => {
                const met = requirements[requirement.key]

                return (
                    <li
                        key={requirement.key}
                        className={cn(
                            'flex items-center gap-2 transition-colors',
                            met ? 'text-emerald-700' : 'text-slate-500'
                        )}
                    >
                        <RequirementIndicator met={met} />
                        <span>{requirement.label}</span>
                    </li>
                )
            })}
        </ul>
    )
}
