'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminMonthlySummary } from '../services/admin-api.service'

export function useAdminMonthlySummaryQuery(businessId: string, month: string, enabled = true) {
    return useQuery({
        queryKey: ['admin-monthly-summary', businessId, month],
        queryFn: () => fetchAdminMonthlySummary(businessId, month),
        enabled: enabled && Boolean(businessId),
    })
}
