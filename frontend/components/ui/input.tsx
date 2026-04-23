import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
        <input
            ref={ref}
            className={cn(
                'w-full min-h-11 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100',
                className
            )}
            {...props}
        />
    )
)

Input.displayName = 'Input'

export { Input }
