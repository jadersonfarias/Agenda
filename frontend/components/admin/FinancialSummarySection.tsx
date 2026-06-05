'use client'

import { useState } from 'react'
import { useAdminFinancialReportQuery } from '../../features/admin/hooks/use-admin-financial-report-query'
import { useAdminMonthlySummaryQuery } from '../../features/admin/hooks/use-admin-monthly-summary-query'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { MonthPicker } from './MonthPicker'

function getCurrentMonthValue() {
    const currentDate = new Date()
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
}

function formatCurrency(value: string | number) {
    const numericValue = typeof value === 'number' ? value : Number(value)

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number.isFinite(numericValue) ? numericValue : 0)
}

function toNumericValue(value: string | number) {
    const numericValue = typeof value === 'number' ? value : Number(value)

    return Number.isFinite(numericValue) ? numericValue : 0
}

function getProgressWidth(value: string | number, maxValue: number) {
    const numericValue = toNumericValue(value)

    if (maxValue <= 0 || numericValue <= 0) {
        return 0
    }

    return Math.max((numericValue / maxValue) * 100, 8)
}

type FinancialSummarySectionProps = {
    businessId: string
    enabled: boolean
    onNavigateToAppointments?: () => void
}

export function FinancialSummarySection({
    businessId,
    enabled,
    onNavigateToAppointments,
}: FinancialSummarySectionProps) {
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue)
    const monthlySummaryQuery = useAdminMonthlySummaryQuery(businessId, selectedMonth, enabled)
    const financialReportQuery = useAdminFinancialReportQuery(businessId, selectedMonth, enabled)
    const isLoading = monthlySummaryQuery.isLoading || financialReportQuery.isLoading
    const hasError = monthlySummaryQuery.isError || financialReportQuery.isError
    const hasFinancialData = Boolean(
        monthlySummaryQuery.data &&
        financialReportQuery.data &&
        (
            monthlySummaryQuery.data.completedAppointments > 0 ||
            financialReportQuery.data.cancellationsCount > 0 ||
            financialReportQuery.data.revenueByService.length > 0
        )
    )
    const revenueByServiceMax = financialReportQuery.data
        ? Math.max(...financialReportQuery.data.revenueByService.map((service) => toNumericValue(service.revenueTotal)), 0)
        : 0
    const topServicesMax = financialReportQuery.data
        ? Math.max(...financialReportQuery.data.topServices.map((service) => toNumericValue(service.revenueTotal)), 0)
        : 0

    return (
        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
            <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-end">
                <div className="min-w-0 space-y-2">
                    <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Financeiro</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Caixa mensal</h2>
                    <p className="mt-2 max-w-2xl text-xs text-slate-600 sm:text-sm">
                        Acompanhe faturamento, atendimentos concluídos e serviços mais vendidos.
                    </p>
                </div>

                <div className="w-full rounded-3xl border border-slate-200 bg-slate-50/80 p-3.5 shadow-sm shadow-slate-100 sm:p-4">
                    <span className="text-xs font-semibold uppercase tracking-[.22em] text-slate-500">Mês de referência</span>
                    <div className="mt-2">
                        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-xs text-slate-500 sm:text-sm">
                    Carregando resumo financeiro...
                </div>
            ) : hasError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-xs text-red-600 sm:text-sm">
                    Não foi possível carregar o resumo financeiro.
                </div>
            ) : monthlySummaryQuery.data && financialReportQuery.data ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <div className="space-y-4">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                            <Card className="relative overflow-hidden border-purple-200 bg-gradient-to-br from-purple-700 via-purple-700 to-fuchsia-700 text-white shadow-lg shadow-purple-200/80">
                                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                                <div className="relative space-y-3">
                                    <p className="text-xs uppercase tracking-[.25em] text-purple-100 sm:text-sm">Faturamento do mês</p>
                                    <p className="text-3xl font-semibold sm:text-4xl">
                                        {formatCurrency(monthlySummaryQuery.data.totalRevenue)}
                                    </p>
                                    <p className="max-w-sm text-sm text-purple-100">
                                        Baseado em atendimentos concluídos.
                                    </p>
                                </div>
                            </Card>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                                <Card className="border-amber-100 bg-amber-50/80 shadow-none">
                                    <p className="text-xs uppercase tracking-[.25em] text-amber-700 sm:text-sm">Concluídos</p>
                                    <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{monthlySummaryQuery.data.completedAppointments}</p>
                                    <p className="mt-2 text-xs text-slate-600 sm:text-sm">
                                        Atendimentos finalizados com sucesso neste mês.
                                    </p>
                                </Card>

                                <Card className="border-emerald-100 bg-emerald-50/80 shadow-none">
                                    <p className="text-xs uppercase tracking-[.25em] text-emerald-700 sm:text-sm">Ticket médio</p>
                                    <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
                                        {formatCurrency(monthlySummaryQuery.data.averageTicket)}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-600 sm:text-sm">Valor médio por atendimento concluído.</p>
                                </Card>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Card className="border-slate-200 bg-slate-50/80 shadow-none">
                                <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Clientes</p>
                                <div className="mt-3 flex items-end gap-2">
                                    <p className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                                        {monthlySummaryQuery.data.activeCustomers}
                                    </p>
                                    <p className="pb-1 text-sm text-slate-500">ativos</p>
                                </div>
                                <p className="mt-1 text-sm font-medium text-slate-700">
                                    {monthlySummaryQuery.data.inactiveCustomers} inativos
                                </p>
                                <p className="mt-2 text-xs text-slate-600 sm:text-sm">
                                    Ativo = atendimento concluído nos últimos {monthlySummaryQuery.data.activeCustomerWindowDays} dias.
                                </p>
                            </Card>

                            <Card className="border-rose-100 bg-rose-50/80 shadow-none">
                                <p className="text-xs uppercase tracking-[.25em] text-rose-700 sm:text-sm">Cancelamentos</p>
                                <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
                                    {financialReportQuery.data.cancellationsCount}
                                </p>
                                <p className="mt-2 text-xs text-slate-600 sm:text-sm">
                                    {financialReportQuery.data.cancellationsCount > 0
                                        ? 'Reservas canceladas dentro do mês selecionado.'
                                        : 'Nenhum cancelamento registrado neste mês.'}
                                </p>
                            </Card>
                        </div>

                        {!hasFinancialData ? (
                            <div className="rounded-3xl border border-dashed border-purple-200 bg-purple-50/70 px-5 py-6 sm:px-6">
                                <p className="text-base font-semibold text-slate-900">Nenhum atendimento concluído ainda.</p>
                                <p className="mt-2 text-sm text-slate-600">
                                    Quando você marcar agendamentos como concluídos, o faturamento aparecerá aqui automaticamente.
                                </p>
                                {onNavigateToAppointments ? (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={onNavigateToAppointments}
                                        className="mt-4 min-h-11 w-full sm:w-auto"
                                    >
                                        Ver agenda
                                    </Button>
                                ) : null}
                            </div>
                        ) : null}

                        <Card className="border-slate-200 bg-white shadow-none">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Receita por serviço</p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Valor fechado usando o snapshot de preço dos agendamentos concluídos.
                                    </p>
                                </div>
                            </div>

                            {financialReportQuery.data.revenueByService.length > 0 ? (
                                <div className="space-y-3">
                                    {financialReportQuery.data.revenueByService.map((service) => (
                                        <div
                                            key={service.serviceId}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                                        >
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">{service.serviceName}</p>
                                                    <p className="text-xs text-slate-600 sm:text-sm">
                                                        {service.appointmentsCompleted} atendimento(s) finalizado(s)
                                                    </p>
                                                </div>
                                                <p className="text-sm font-semibold text-purple-700 sm:text-base">
                                                    {formatCurrency(service.revenueTotal)}
                                                </p>
                                            </div>
                                            <div className="mt-3 h-2 rounded-full bg-slate-200">
                                                <div
                                                    className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-emerald-500"
                                                    style={{ width: `${getProgressWidth(service.revenueTotal, revenueByServiceMax)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                    Nenhuma receita por serviço encontrada neste mês.
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card className="border-slate-200 bg-white shadow-none">
                            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Top serviços</p>
                            <p className="mt-1 text-sm text-slate-600">
                                Os serviços com maior impacto no caixa no período selecionado.
                            </p>
                            <div className="mt-4 space-y-3">
                                {financialReportQuery.data.topServices.length > 0 ? (
                                    financialReportQuery.data.topServices.map((service, index) => (
                                        <div
                                            key={service.serviceId}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                                        >
                                            <div className="flex gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-sm font-semibold text-purple-700">
                                                    #{index + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                                {service.serviceName}
                                                            </p>
                                                            <p className="text-xs text-slate-600 sm:text-sm">
                                                                {service.appointmentsCompleted} atendimento(s)
                                                            </p>
                                                        </div>
                                                        <p className="shrink-0 text-sm font-semibold text-purple-700">
                                                            {formatCurrency(service.revenueTotal)}
                                                        </p>
                                                    </div>
                                                    <div className="mt-3 h-2 rounded-full bg-slate-200">
                                                        <div
                                                            className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-400"
                                                            style={{ width: `${getProgressWidth(service.revenueTotal, topServicesMax)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                        Nenhum serviço em destaque neste mês.
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card className="border-slate-200 bg-slate-50/80 shadow-none">
                            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Leitura rápida</p>
                            <div className="mt-4 space-y-3">
                                <div className="rounded-2xl border border-white/70 bg-white px-4 py-3">
                                    <p className="text-xs uppercase tracking-[.18em] text-slate-500">Atendimentos concluídos</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">
                                        {monthlySummaryQuery.data.completedAppointments}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/70 bg-white px-4 py-3">
                                    <p className="text-xs uppercase tracking-[.18em] text-slate-500">Receita total no período</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">
                                {formatCurrency(monthlySummaryQuery.data.totalRevenue)}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/70 bg-white px-4 py-3">
                                    <p className="text-xs uppercase tracking-[.18em] text-slate-500">Ticket médio</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">
                                        {formatCurrency(monthlySummaryQuery.data.averageTicket)}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            ) : null}
        </Card>
    )
}
