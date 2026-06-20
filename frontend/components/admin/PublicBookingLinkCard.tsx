'use client'

import { Copy, ExternalLink, Globe2, Link2, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { type AdminBusinessSettings } from '../../features/admin/types'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

type PublicBookingLinkCardProps = {
    business: AdminBusinessSettings
}

export function PublicBookingLinkCard({ business }: PublicBookingLinkCardProps) {
    const [publicBookingUrl, setPublicBookingUrl] = useState(`/b/${business.slug}`)

    useEffect(() => {
        if (typeof window === 'undefined') {
            setPublicBookingUrl(`/b/${business.slug}`)
            return
        }

        setPublicBookingUrl(`${window.location.origin}/b/${business.slug}`)
    }, [business.slug])

    const handleCopyLink = async () => {
        if (typeof navigator === 'undefined' || !navigator.clipboard) {
            toast.error('Não foi possível copiar o link neste navegador')
            return
        }

        try {
            await navigator.clipboard.writeText(publicBookingUrl)
            toast.success('Link de agendamento copiado')
        } catch {
            toast.error('Não foi possível copiar o link agora')
        }
    }

    return (
        <Card className="border-purple-100 bg-white shadow-lg shadow-purple-100/50">
            <div className="space-y-5 sm:space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                            <Link2 className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <p className="text-xs font-semibold uppercase tracking-[.28em] text-purple-700 sm:text-sm">
                            Link de agendamento
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
                            Página pública do negócio
                        </h2>
                        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                            Compartilhe este link completo com clientes para receber reservas online no seu negócio.
                        </p>
                    </div>
                </div>

                <div className="h-px w-full bg-slate-200" aria-hidden="true" />

                <div className="space-y-4 rounded-3xl border border-purple-100 bg-purple-50/40 px-4 py-4 sm:px-5 sm:py-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:text-sm">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                        URL pública ativa
                    </div>

                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 ring-1 ring-purple-200 sm:h-14 sm:w-14">
                            <Globe2 className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                        </span>

                        <p className="min-w-0 flex-1 break-all text-sm font-semibold leading-6 text-slate-950 sm:text-base">
                            {publicBookingUrl}
                        </p>

                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-purple-100 bg-white text-purple-700 shadow-sm transition hover:border-purple-200 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:h-12 sm:w-12"
                            aria-label="Copiar link público"
                            title="Copiar link"
                        >
                            <Copy className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                <div className="flex items-start gap-3 text-sm leading-6 text-slate-600 sm:text-base">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" aria-hidden="true" />
                    <p>
                        Este é o link que seus clientes usarão para agendar. Ele está sempre ativo e pode ser compartilhado.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCopyLink}
                        className="min-h-14 gap-2 border border-purple-100 bg-white text-slate-950 shadow-sm hover:bg-purple-50 sm:w-full"
                    >
                        <Copy className="h-5 w-5 text-purple-700" aria-hidden="true" />
                        <span>Copiar link</span>
                    </Button>
                    <a
                        href={publicBookingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-purple-200/70 transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:px-6 sm:text-sm"
                    >
                        <ExternalLink className="h-5 w-5" aria-hidden="true" />
                        <span>Abrir página pública</span>
                    </a>
                </div>
            </div>
        </Card>
    )
}
