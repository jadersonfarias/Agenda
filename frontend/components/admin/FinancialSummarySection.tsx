'use client'

import { useState } from 'react'
import { useAdminMonthlySummaryQuery } from '../../features/admin/hooks/use-admin-monthly-summary-query'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

function getCurrentMonthValue() {
    const currentDate = new Date()
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
}

type FinancialSummarySectionProps = {
    businessId: string
    enabled: boolean
}

export function FinancialSummarySection({ businessId, enabled }: FinancialSummarySectionProps) {
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue)
    const monthlySummaryQuery = useAdminMonthlySummaryQuery(businessId, selectedMonth, enabled)

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
                    <Input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
                </Label>
            </div>

            {monthlySummaryQuery.isLoading ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-xs text-slate-500 sm:text-sm">
                    Carregando resumo financeiro...
                </div>
            ) : monthlySummaryQuery.isError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-xs text-red-600 sm:text-sm">
                    Não foi possível carregar o resumo financeiro.
                </div>
            ) : monthlySummaryQuery.data ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="border-slate-200 bg-slate-50 shadow-none">
                        <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Faturamento</p>
                        <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">R$ {monthlySummaryQuery.data.totalRevenue}</p>
                        <p className="mt-2 text-xs text-slate-600 sm:text-sm">Somente agendamentos concluídos no mês.</p>
                    </Card>
                    <Card className="border-slate-200 bg-slate-50 shadow-none">
                        <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Concluídos</p>
                        <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{monthlySummaryQuery.data.completedAppointments}</p>
                        <p className="mt-2 text-xs text-slate-600 sm:text-sm">Atendimentos com status `COMPLETED`.</p>
                    </Card>
                    <Card className="border-slate-200 bg-slate-50 shadow-none">
                        <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Ticket médio</p>
                        <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">R$ {monthlySummaryQuery.data.averageTicket}</p>
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
            ) : null}
        </Card>
    )
}
