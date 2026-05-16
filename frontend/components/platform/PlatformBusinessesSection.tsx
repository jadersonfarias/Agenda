'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { usePlatformBusinessesQuery } from '../../features/platform/hooks/use-platform-businesses-query'
import {
  platformPlanBadgeStyles,
  platformSubscriptionStatusBadgeStyles,
  platformSubscriptionStatusLabels,
} from '../../features/platform/presentation'
import { type PlatformBusinessItem } from '../../features/platform/types'
import { formatIsoCalendarDate } from '../../lib/date-format'
import { PlatformBusinessSubscriptionManager } from './PlatformBusinessSubscriptionManager'
import { Card } from '../ui/card'
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from '../ui/table'

function ManagementLink({ businessId, selected }: { businessId: string; selected: boolean }) {
  return (
    <Link
      href={`/admin-master?businessId=${encodeURIComponent(businessId)}`}
      className={`inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 sm:w-auto ${
        selected
          ? 'bg-purple-700 text-white hover:bg-purple-800 focus:ring-purple-200'
          : 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-200'
      }`}
    >
      Gerenciar
    </Link>
  )
}

function BusinessOwner({ business }: { business: PlatformBusinessItem }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-slate-900">{business.owner.name}</p>
      <p className="break-all text-xs text-slate-500 sm:text-sm">{business.owner.email}</p>
    </div>
  )
}

export function PlatformBusinessesSection() {
  const searchParams = useSearchParams()
  const selectedBusinessId = searchParams.get('businessId')
  const selectedBusinessCardRef = useRef<HTMLDivElement | null>(null)
  const lastScrolledBusinessIdRef = useRef<string | null>(null)
  const businessesQuery = usePlatformBusinessesQuery(1, 100)
  const businesses = businessesQuery.data?.data ?? []
  const total = businessesQuery.data?.meta.total ?? businesses.length
  const selectedBusiness = businesses.find((business) => business.id === selectedBusinessId) ?? null
  const activeClients = businesses.filter((business) => business.subscriptionStatus === 'ACTIVE').length
  const trialClients = businesses.filter((business) => business.subscriptionStatus === 'TRIALING').length
  const inactiveClients = businesses.filter(
    (business) =>
      business.subscriptionStatus === 'PAST_DUE' || business.subscriptionStatus === 'CANCELED',
  ).length
  const hasPartialResults = total > businesses.length
  const summaryCards = [
    {
      label: 'Total de clientes',
      value: total,
      description: hasPartialResults
        ? `Mostrando ${businesses.length} carregados nesta visão.`
        : 'Negócios cadastrados na plataforma.',
      accentClassName: 'border-purple-200 bg-purple-50/70',
      valueClassName: 'text-purple-800',
    },
    {
      label: 'Clientes ativos',
      value: activeClients,
      description: 'Assinaturas ativas e prontas para operar.',
      accentClassName: 'border-emerald-200 bg-emerald-50/80',
      valueClassName: 'text-emerald-700',
    },
    {
      label: 'Clientes em teste grátis',
      value: trialClients,
      description: 'Negócios em período de teste grátis.',
      accentClassName: 'border-sky-200 bg-sky-50/80',
      valueClassName: 'text-sky-700',
    },
    {
      label: 'Vencidos ou cancelados',
      value: inactiveClients,
      description: 'Clientes que precisam de ação comercial ou financeira.',
      accentClassName: 'border-amber-200 bg-amber-50/80',
      valueClassName: 'text-amber-700',
    },
  ] as const

  useEffect(() => {
    if (!selectedBusinessId) {
      lastScrolledBusinessIdRef.current = null
      return
    }

    if (businessesQuery.isLoading || !selectedBusiness) {
      return
    }

    if (lastScrolledBusinessIdRef.current === selectedBusinessId) {
      return
    }

    lastScrolledBusinessIdRef.current = selectedBusinessId

    const animationFrameId = window.requestAnimationFrame(() => {
      selectedBusinessCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })

    return () => window.cancelAnimationFrame(animationFrameId)
  }, [selectedBusinessId, selectedBusiness, businessesQuery.isLoading])

  return (
    <section className="space-y-4 sm:space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card
            key={card.label}
            className={`shadow-lg shadow-slate-200/60 ${card.accentClassName}`}
          >
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">
                {card.label}
              </p>
              <p className={`text-3xl font-semibold sm:text-4xl ${card.valueClassName}`}>
                {businessesQuery.isLoading ? '--' : card.value}
              </p>
              <p className="text-sm leading-6 text-slate-600">
                {businessesQuery.isError
                  ? 'Não foi possível carregar este indicador agora.'
                  : card.description}
              </p>
            </div>
          </Card>
        ))}
      </section>

      {selectedBusiness ? (
        <div ref={selectedBusinessCardRef}>
          <PlatformBusinessSubscriptionManager business={selectedBusiness} />
        </div>
      ) : (
        <Card className="border-dashed border-slate-300 bg-slate-50 shadow-none">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Gestão de planos</p>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Selecione um cliente para gerenciar</h2>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Use o botão &quot;Gerenciar&quot; na lista abaixo para abrir a área de ativação ou renovação manual de plano.
            </p>
          </div>
        </Card>
      )}

      <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Clientes SaaS</p>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Negócios cadastrados</h2>
              <p className="mt-1 text-sm text-slate-600 sm:text-base">
                Visualize donos, planos, status de assinatura e volume operacional de cada cliente.
              </p>
            </div>
          </div>

          <div className="inline-flex w-full items-center justify-center rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800 sm:w-auto">
            {hasPartialResults
              ? `${businesses.length} de ${total} clientes`
              : `${total} cliente${total === 1 ? '' : 's'}`}
          </div>
        </div>
      </Card>

      {businessesQuery.isLoading ? (
        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            Carregando clientes da plataforma...
          </div>
        </Card>
      ) : null}

      {businessesQuery.isError ? (
        <Card className="border-red-200 bg-red-50 shadow-lg shadow-red-100/40">
          <div className="rounded-3xl border border-red-200 px-6 py-10 text-center text-sm text-red-600">
            {businessesQuery.error instanceof Error
              ? businessesQuery.error.message
              : 'Não foi possível carregar os clientes da plataforma.'}
          </div>
        </Card>
      ) : null}

      {!businessesQuery.isLoading && !businessesQuery.isError && businesses.length === 0 ? (
        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            Nenhum negócio encontrado no painel master.
          </div>
        </Card>
      ) : null}

      {!businessesQuery.isLoading && !businessesQuery.isError && businesses.length > 0 ? (
        <>
          <div className="grid gap-4 lg:hidden">
            {businesses.map((business) => {
              const isSelected = selectedBusinessId === business.id

              return (
                <Card
                  key={business.id}
                  className={`border-slate-200 bg-white shadow-lg shadow-slate-200/60 ${
                    isSelected ? 'ring-2 ring-purple-200' : ''
                  }`}
                >
                  <div className="space-y-4" id={`business-${business.id}`}>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{business.name}</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[.18em] ${platformPlanBadgeStyles[business.plan]}`}>
                          {business.plan}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[.02em] ${platformSubscriptionStatusBadgeStyles[business.subscriptionStatus]}`}>
                          {platformSubscriptionStatusLabels[business.subscriptionStatus]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{business.slug}</p>
                    </div>

                    <BusinessOwner business={business} />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Teste grátis</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatIsoCalendarDate(business.trialEndsAt) ?? '-'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Assinatura</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatIsoCalendarDate(business.subscriptionEndsAt) ?? '-'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Agendamentos</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{business.counts.appointments}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Membros</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{business.counts.memberships}</p>
                      </div>
                    </div>

                    <ManagementLink businessId={business.id} selected={isSelected} />
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="hidden overflow-hidden border-slate-200 bg-white shadow-lg shadow-slate-200/60 lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeadCell>Negócio</TableHeadCell>
                    <TableHeadCell>Dono</TableHeadCell>
                    <TableHeadCell>Plano</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell>Teste grátis</TableHeadCell>
                    <TableHeadCell>Assinatura</TableHeadCell>
                    <TableHeadCell>Agendamentos</TableHeadCell>
                    <TableHeadCell>Membros</TableHeadCell>
                    <TableHeadCell className="text-right">Ações</TableHeadCell>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {businesses.map((business) => {
                    const isSelected = selectedBusinessId === business.id

                    return (
                      <TableRow
                        key={business.id}
                        className={isSelected ? 'bg-purple-50/60' : ''}
                      >
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{business.name}</p>
                            <p className="text-xs text-slate-500">{business.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <BusinessOwner business={business} />
                        </TableCell>
                        <TableCell>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[.18em] ${platformPlanBadgeStyles[business.plan]}`}>
                            {business.plan}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[.02em] ${platformSubscriptionStatusBadgeStyles[business.subscriptionStatus]}`}>
                            {platformSubscriptionStatusLabels[business.subscriptionStatus]}
                          </span>
                        </TableCell>
                        <TableCell>{formatIsoCalendarDate(business.trialEndsAt) ?? '-'}</TableCell>
                        <TableCell>{formatIsoCalendarDate(business.subscriptionEndsAt) ?? '-'}</TableCell>
                        <TableCell>{business.counts.appointments}</TableCell>
                        <TableCell>{business.counts.memberships}</TableCell>
                        <TableCell className="text-right">
                          <ManagementLink businessId={business.id} selected={isSelected} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      ) : null}
    </section>
  )
}
