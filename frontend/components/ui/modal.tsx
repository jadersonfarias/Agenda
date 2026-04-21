import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type ModalProps = {
    title: string
    description?: string
    open: boolean
    onClose: () => void
    children: ReactNode
}

export function Modal({ title, description, open, onClose, children }: ModalProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
                    </div>
                    <button className="text-slate-500 transition hover:text-slate-900" onClick={onClose}>
                        Fechar
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    )
}
