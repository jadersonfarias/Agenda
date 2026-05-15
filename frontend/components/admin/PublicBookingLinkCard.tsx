'use client'

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
        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
            <div className="flex flex-col gap-4">
                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Link de agendamento</p>
                    <h2 className="text-lg font-semibold text-slate-900 sm:text-2xl">Página pública do negócio</h2>
                    <p className="text-xs text-slate-600 sm:text-sm">
                        Compartilhe este link completo com clientes para receber reservas online no seu negócio.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[.22em] text-slate-500 sm:text-xs">URL pública ativa</p>
                    <p className="mt-2 break-all text-sm font-medium text-slate-900 sm:text-base">{publicBookingUrl}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                    <Button type="button" variant="secondary" onClick={handleCopyLink} className="min-h-12 lg:min-h-0">
                        Copiar link
                    </Button>
                    <a
                        href={publicBookingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-purple-700 px-4 py-3 text-base font-semibold text-white transition hover:bg-purple-800 sm:px-6 sm:text-sm"
                    >
                        Abrir página pública
                    </a>
                </div>
            </div>
        </Card>
    )
}
