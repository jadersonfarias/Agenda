import { forwardRef, SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, ...props }, ref) => (
        <select
            ref={ref}
            className={cn(
                'w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100',
                className
            )}
            {...props}
        />
    )
)

Select.displayName = 'Select'

export { Select }
