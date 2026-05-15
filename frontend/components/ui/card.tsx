import { cn } from '../../lib/utils'
import { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'w-full rounded-[1.75rem] border border-purple-200 bg-white/90 p-3.5 shadow-xl shadow-purple-100/50 sm:rounded-3xl sm:p-6 lg:p-8',
                className
            )}
            {...props}
        />
    )
}
