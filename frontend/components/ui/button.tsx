import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'default' | 'secondary' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
    default: 'bg-purple-700 text-white hover:bg-purple-800 focus:ring-purple-200',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-200',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', ...props }, ref) => (
        <button
            ref={ref}
            className={cn(
                'inline-flex w-full items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:bg-slate-200 disabled:focus:ring-slate-200',
                variantClasses[variant],
                className
            )}
            {...props}
        />
    )
)

Button.displayName = 'Button'

export { Button }
