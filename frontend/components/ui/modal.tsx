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
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/50 p-3 sm:items-center sm:p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
                    </div>
                    <button className="self-end text-sm text-slate-500 transition hover:text-slate-900 sm:self-auto" onClick={onClose}>
                        Fechar
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    )
}
