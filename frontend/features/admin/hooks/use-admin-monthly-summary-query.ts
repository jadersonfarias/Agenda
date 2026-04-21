'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminMonthlySummary } from '../services/admin-api.service'

export function useAdminMonthlySummaryQuery(month: string, enabled = true) {
    return useQuery({
        queryKey: ['admin-monthly-summary', month],
        queryFn: () => fetchAdminMonthlySummary(month),
        enabled,
    })
}
