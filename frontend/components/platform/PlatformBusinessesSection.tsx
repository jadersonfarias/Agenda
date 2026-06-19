'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { usePlatformBusinessesQuery } from '../../features/platform/hooks/use-platform-businesses-query'
import {
  platformPlanBadgeStyles,
  platformSubscriptionStatusBadgeStyles,
  platformSubscriptionStatusLabels,
} from '../../features/platform/presentation'
import { type PlatformBusinessItem } from '../../features/platform/types'
import { isApiSessionExpiredError } from '../../lib/api'
import { formatIsoCalendarDate } from '../../lib/date-format'
import { PlatformBusinessSubscriptionManager } from './PlatformBusinessSubscriptionManager'
import { Card } from '../ui/card'
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from '../ui/table'

function getPositiveIntegerParam(value: string | null, fallback: number, maxValue?: number) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback
  }

  return maxValue ? Math.min(parsedValue, maxValue) : parsedValue
}

function ManagementLink({
  businessId,
  page,
  perPage,
  selected,
}: {
  businessId: string
  page: number
  perPage: number
  selected: boolean
}) {
  const params = new URLSearchParams({
    businessId,
    page: String(page),
    perPage: String(perPage),
  })

  return (
    <Link
      href={`/admin-master?${params.toString()}`}
      className={`inline-flex min-h-11 w-full min-w-[7.5rem] shrink-0 items-center justify-center whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 sm:w-auto ${
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
    <div className="min-w-0 max-w-full sm:max-w-[18rem] lg:max-w-[15rem]">
      <p className="truncate text-sm font-semibold text-slate-900" title={business.owner.name}>
        {business.owner.name}
      </p>
      <p className="truncate text-xs text-slate-500 sm:text-sm" title={business.owner.email}>
        {business.owner.email}
      </p>
    </div>
  )
}

export function PlatformBusinessesSection() {
  const searchParams = useSearchParams()
  const selectedBusinessId = searchParams.get('businessId')
  const selectedBusinessCardRef = useRef<HTMLDivElement | null>(null)
  const lastScrolledBusinessIdRef = useRef<string | null>(null)
  const [page, setPage] = useState(() => getPositiveIntegerParam(searchParams.get('page'), 1))
  const [perPage] = useState(() => getPositiveIntegerParam(searchParams.get('perPage'), 20, 100))
  const businessesQuery = usePlatformBusinessesQuery(page, perPage)
  const hasSessionExpiredError = isApiSessionExpiredError(businessesQuery.error)
  const businesses = businessesQuery.data?.data ?? []
  const meta = businessesQuery.data?.meta
  const currentPage = meta?.page ?? page
  const total = meta?.total ?? 0
  const totalPages = meta?.totalPages ?? (total > 0 ? 1 : 0)
  const displayCurrentPage = totalPages === 0 ? 0 : currentPage
  const navigationTotalPages = Math.max(totalPages, 1)
  const loadedCount = businesses.length
  const firstLoadedItem = loadedCount > 0 ? (currentPage - 1) * (meta?.perPage ?? perPage) + 1 : 0
  const lastLoadedItem = loadedCount > 0 ? firstLoadedItem + loadedCount - 1 : 0
  const canGoToPreviousPage = currentPage > 1 && !businessesQuery.isLoading
  const canGoToNextPage = currentPage < navigationTotalPages && !businessesQuery.isLoading
  const selectedBusiness = businesses.find((business) => business.id === selectedBusinessId) ?? null
  const hasSelectedBusinessOutsidePage = Boolean(
    selectedBusinessId && !selectedBusiness && !businessesQuery.isLoading && !businessesQuery.isError,
  )
  const activeClients = businesses.filter((business) => business.subscriptionStatus === 'ACTIVE').length
  const trialClients = businesses.filter((business) => business.subscriptionStatus === 'TRIALING').length
  const inactiveClients = businesses.filter(
    (business) =>
      business.subscriptionStatus === 'PAST_DUE' || business.subscriptionStatus === 'CANCELED',
  ).length
  const hasPartialResults = total > loadedCount
  const summaryCards = [
    {
      label: 'Total de clientes',
      value: total,
      description: hasPartialResults
        ? `Mostrando ${firstLoadedItem}-${lastLoadedItem} nesta página.`
        : 'Negócios cadastrados na plataforma.',
      accentClassName: 'border-purple-200 bg-purple-50/70',
      valueClassName: 'text-purple-800',
    },
    {
      label: 'Clientes ativos',
      value: activeClients,
      description: 'Assinaturas ativas nesta página.',
      accentClassName: 'border-emerald-200 bg-emerald-50/80',
      valueClassName: 'text-emerald-700',
    },
    {
      label: 'Clientes em teste grátis',
      value: trialClients,
      description: 'Negócios em teste grátis nesta página.',
      accentClassName: 'border-sky-200 bg-sky-50/80',
      valueClassName: 'text-sky-700',
    },
    {
      label: 'Vencidos ou cancelados',
      value: inactiveClients,
      description: 'Clientes nesta página que precisam de ação.',
      accentClassName: 'border-amber-200 bg-amber-50/80',
      valueClassName: 'text-amber-700',
    },
  ] as const

  function goToPreviousPage() {
    setPage((current) => Math.max(current - 1, 1))
  }

  function goToNextPage() {
    setPage((current) => Math.min(current + 1, navigationTotalPages))
  }

  useEffect(() => {
    if (!meta || totalPages === 0 || page <= totalPages) {
      return
    }

    setPage(totalPages)
  }, [meta, page, totalPages])

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
      ) : hasSelectedBusinessOutsidePage ? (
        <Card className="border-dashed border-amber-300 bg-amber-50 shadow-none">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[.25em] text-amber-700 sm:text-sm">Gestão de planos</p>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Cliente selecionado fora desta página</h2>
            <p className="text-sm leading-6 text-slate-700 sm:text-base">
              O cliente selecionado continua preservado na URL, mas ele não está na página atual. Navegue pelas páginas ou clique em &quot;Gerenciar&quot; em um cliente visível.
            </p>
          </div>
        </Card>
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Clientes SaaS</p>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Negócios cadastrados</h2>
              <p className="mt-1 text-sm text-slate-600 sm:text-base">
                Visualize donos, planos, status de assinatura e volume operacional de cada cliente.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            <div className="rounded-2xl bg-purple-100 px-4 py-3 text-center text-sm font-semibold text-purple-800 sm:text-left">
              <span className="block">
                {total} cliente{total === 1 ? '' : 's'}
              </span>
              <span className="mt-1 block text-xs font-medium text-purple-700">
                Página {displayCurrentPage} de {totalPages}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={!canGoToPreviousPage}
                className="min-h-11 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={goToNextPage}
                disabled={!canGoToNextPage}
                className="min-h-11 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
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

      {businessesQuery.isError && !hasSessionExpiredError ? (
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
                        <h3 className="min-w-0 break-words text-lg font-semibold text-slate-900">{business.name}</h3>
                        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[.18em] ${platformPlanBadgeStyles[business.plan]}`}>
                          {business.plan}
                        </span>
                        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold tracking-[.02em] ${platformSubscriptionStatusBadgeStyles[business.subscriptionStatus]}`}>
                          {platformSubscriptionStatusLabels[business.subscriptionStatus]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{business.slug}</p>
                    </div>

                    <BusinessOwner business={business} />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="whitespace-nowrap text-[11px] uppercase tracking-[.2em] text-slate-500">Teste grátis</p>
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

                    <ManagementLink
                      businessId={business.id}
                      page={currentPage}
                      perPage={perPage}
                      selected={isSelected}
                    />
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="hidden overflow-hidden border-slate-200 bg-white shadow-lg shadow-slate-200/60 lg:block">
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[1120px]">
                <TableHeader>
                  <TableRow>
                    <TableHeadCell className="min-w-[220px]">Negócio</TableHeadCell>
                    <TableHeadCell className="min-w-[240px]">Dono</TableHeadCell>
                    <TableHeadCell className="whitespace-nowrap">Plano</TableHeadCell>
                    <TableHeadCell className="min-w-[150px] whitespace-nowrap">Status</TableHeadCell>
                    <TableHeadCell className="whitespace-nowrap">Teste grátis</TableHeadCell>
                    <TableHeadCell className="whitespace-nowrap">Assinatura</TableHeadCell>
                    <TableHeadCell className="whitespace-nowrap">Agendamentos</TableHeadCell>
                    <TableHeadCell className="whitespace-nowrap">Membros</TableHeadCell>
                    <TableHeadCell className="sticky right-0 z-20 min-w-[150px] whitespace-nowrap bg-slate-50 pl-6 pr-6 text-right">
                      Ações
                    </TableHeadCell>
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
                        <TableCell className="max-w-[260px]">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900" title={business.name}>
                              {business.name}
                            </p>
                            <p className="truncate text-xs text-slate-500" title={business.slug}>
                              {business.slug}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <BusinessOwner business={business} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[.18em] ${platformPlanBadgeStyles[business.plan]}`}>
                            {business.plan}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold tracking-[.02em] ${platformSubscriptionStatusBadgeStyles[business.subscriptionStatus]}`}>
                            {platformSubscriptionStatusLabels[business.subscriptionStatus]}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatIsoCalendarDate(business.trialEndsAt) ?? '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatIsoCalendarDate(business.subscriptionEndsAt) ?? '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{business.counts.appointments}</TableCell>
                        <TableCell className="whitespace-nowrap">{business.counts.memberships}</TableCell>
                        <TableCell
                          className={`sticky right-0 z-10 whitespace-nowrap pl-6 pr-6 text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] ${
                            isSelected ? 'bg-purple-50/95' : 'bg-white'
                          }`}
                        >
                          <ManagementLink
                            businessId={business.id}
                            page={currentPage}
                            perPage={perPage}
                            selected={isSelected}
                          />
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
