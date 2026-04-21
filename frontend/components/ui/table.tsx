import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type TableProps = {
    className?: string
    children: ReactNode
}

export function Table({ className, children }: TableProps) {
    return <table className={cn('min-w-full divide-y divide-slate-200', className)}>{children}</table>
}

export function TableHeader({ className, children }: TableProps) {
    return <thead className={cn('bg-slate-50', className)}>{children}</thead>
}

export function TableBody({ className, children }: TableProps) {
    return <tbody className={cn('bg-white divide-y divide-slate-200', className)}>{children}</tbody>
}

export function TableRow({ className, children }: TableProps) {
    return <tr className={cn(className)}>{children}</tr>
}

export function TableCell({ className, children }: TableProps) {
    return <td className={cn('px-4 py-4 text-sm text-slate-700', className)}>{children}</td>
}

export function TableHeadCell({ className, children }: TableProps) {
    return <th scope="col" className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500', className)}>{children}</th>
}
