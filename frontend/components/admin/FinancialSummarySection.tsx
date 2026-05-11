'use client'

import { useState } from 'react'
import { useAdminFinancialReportQuery } from '../../features/admin/hooks/use-admin-financial-report-query'
import { useAdminMonthlySummaryQuery } from '../../features/admin/hooks/use-admin-monthly-summary-query'
import { Card } from '../ui/card'
import { Label } from '../ui/label'
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

type FinancialSummarySectionProps = {
    businessId: string
    enabled: boolean
}

export function FinancialSummarySection({ businessId, enabled }: FinancialSummarySectionProps) {
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

    return (
        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Financeiro</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Caixa mensal</h2>
                    <p className="mt-2 max-w-2xl text-xs text-slate-600 sm:text-sm">
                        Resumo simples do mês com base em agendamentos concluídos e atividade recente dos clientes.
                    </p>
                </div>

                <Label className="w-full space-y-2 sm:max-w-xs">
                    <span className="text-xs text-slate-600 sm:text-sm">Mês de referência</span>
                    <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
                </Label>
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
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Card className="border-slate-200 bg-slate-50 shadow-none">
                            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Faturamento</p>
                            <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
                                {formatCurrency(monthlySummaryQuery.data.totalRevenue)}
                            </p>
                            <p className="mt-2 text-xs text-slate-600 sm:text-sm">Somente agendamentos concluídos no mês.</p>
                        </Card>
                        <Card className="border-slate-200 bg-slate-50 shadow-none">
                            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Concluídos</p>
                            <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{monthlySummaryQuery.data.completedAppointments}</p>
                            <p className="mt-2 text-xs text-slate-600 sm:text-sm">Atendimentos finalizados com sucesso neste mês.</p>
                        </Card>
                        <Card className="border-slate-200 bg-slate-50 shadow-none">
                            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Ticket médio</p>
                            <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
                                {formatCurrency(monthlySummaryQuery.data.averageTicket)}
                            </p>
                            <p className="mt-2 text-xs text-slate-600 sm:text-sm">Valor médio por atendimento concluído.</p>
                        </Card>
                        <Card className="border-slate-200 bg-slate-50 shadow-none">
                            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Clientes</p>
                            <p className="mt-3 text-lg font-semibold text-slate-900 sm:text-xl">
                                {monthlySummaryQuery.data.activeCustomers} ativos / {monthlySummaryQuery.data.inactiveCustomers} inativos
                            </p>
                            <p className="mt-2 text-xs text-slate-600 sm:text-sm">
                                Ativo = atendimento concluído nos últimos {monthlySummaryQuery.data.activeCustomerWindowDays} dias.
                            </p>
                        </Card>
                    </div>

                    {!hasFinancialData ? (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
                            <p className="text-sm font-medium text-slate-900 sm:text-base">Ainda não há movimentação neste mês.</p>
                            <p className="mt-2 text-xs text-slate-600 sm:text-sm">
                                Quando houver atendimentos finalizados ou cancelamentos, os detalhes aparecerão aqui.
                            </p>
                        </div>
                    ) : null}

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                        <Card className="border-slate-200 bg-white shadow-none">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Receita por serviço</p>
                                    <p className="mt-1 text-sm text-slate-600">Valor fechado usando o snapshot de preço dos agendamentos concluídos.</p>
                                </div>
                            </div>

                            {financialReportQuery.data.revenueByService.length > 0 ? (
                                <div className="space-y-3">
                                    {financialReportQuery.data.revenueByService.map((service) => (
                                        <div
                                            key={service.serviceId}
                                            className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
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
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                    Nenhuma receita por serviço encontrada neste mês.
                                </div>
                            )}
                        </Card>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                            <Card className="border-slate-200 bg-slate-50 shadow-none">
                                <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Cancelamentos</p>
                                <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
                                    {financialReportQuery.data.cancellationsCount}
                                </p>
                                <p className="mt-2 text-xs text-slate-600 sm:text-sm">
                                    Reservas canceladas dentro do mês selecionado.
                                </p>
                            </Card>

                            <Card className="border-slate-200 bg-white shadow-none">
                                <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Top serviços</p>
                                <div className="mt-4 space-y-3">
                                    {financialReportQuery.data.topServices.length > 0 ? (
                                        financialReportQuery.data.topServices.map((service, index) => (
                                            <div
                                                key={service.serviceId}
                                                className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-xs uppercase tracking-[.18em] text-slate-500">#{index + 1}</p>
                                                    <p className="truncate text-sm font-semibold text-slate-900">{service.serviceName}</p>
                                                    <p className="text-xs text-slate-600 sm:text-sm">
                                                        {service.appointmentsCompleted} atendimento(s)
                                                    </p>
                                                </div>
                                                <p className="shrink-0 text-sm font-semibold text-purple-700">
                                                    {formatCurrency(service.revenueTotal)}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                            Nenhum serviço em destaque neste mês.
                                        </p>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            ) : null}
        </Card>
    )
}
