import { cn } from '../../lib/utils'
import { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-3xl border border-purple-200 bg-white/90 p-8 shadow-xl shadow-purple-100/50',
                className
            )}
            {...props}
        />
    )
}
