import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type ModalProps = {
    title: string
    description?: string
    open: boolean
    onClose: () => void
    children: ReactNode
    headerIcon?: ReactNode
    overlayClassName?: string
    panelClassName?: string
}

export function Modal({ title, description, open, onClose, children, headerIcon, overlayClassName, panelClassName }: ModalProps) {
    if (!open) return null

    return (
        <div className={cn('fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/50 p-3 sm:items-center sm:p-4', overlayClassName)}>
            <div className={cn('relative w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6', panelClassName)}>
                <button
                    type="button"
                    aria-label="Fechar modal"
                    title="Fechar"
                    className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:right-5 sm:top-5"
                    onClick={onClose}
                >
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
                        <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>
                {headerIcon ? (
                    <div className="mb-5 flex items-start gap-4 pr-10 sm:mb-6 sm:pr-12">
                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 sm:h-16 sm:w-16">
                                {headerIcon}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl font-semibold leading-tight text-slate-950 sm:text-2xl">{title}</h2>
                                {description ? <p className="mt-1.5 text-sm leading-6 text-slate-600 sm:text-base">{description}</p> : null}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-4 pr-10 sm:pr-12">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
                        </div>
                    </div>
                )}
                <div>{children}</div>
            </div>
        </div>
    )
}
