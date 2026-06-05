'use client'

import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { cn } from '../../lib/utils'
import { Input } from './input'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

function EyeIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}

function EyeOffIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 3 21 21" />
            <path d="M10.6 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-4.4" />
            <path d="M9.9 5.2A11 11 0 0 1 12 5c6 0 9.5 7 9.5 7a16.8 16.8 0 0 1-3.2 4.2" />
            <path d="M6.7 6.8A16.2 16.2 0 0 0 2.5 12s3.5 7 9.5 7c1.7 0 3.2-.5 4.5-1.2" />
        </svg>
    )
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ className, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false)
    const actionLabel = isVisible ? 'Ocultar senha' : 'Mostrar senha'

    return (
        <div className="relative">
            <Input
                ref={ref}
                type={isVisible ? 'text' : 'password'}
                className={cn('pr-14 sm:pr-16', className)}
                {...props}
            />
            <button
                type="button"
                aria-label={actionLabel}
                aria-pressed={isVisible}
                title={actionLabel}
                onClick={() => setIsVisible((currentValue) => !currentValue)}
                className="absolute right-1.5 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-purple-100 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:text-purple-700"
            >
                {isVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
        </div>
    )
})

PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
