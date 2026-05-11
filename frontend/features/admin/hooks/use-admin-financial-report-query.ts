'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminFinancialReport } from '../services/admin-api.service'

export function useAdminFinancialReportQuery(businessId: string, month: string, enabled = true) {
    return useQuery({
        queryKey: ['admin-financial-report', businessId, month],
        queryFn: () => fetchAdminFinancialReport(businessId, month),
        enabled: enabled && Boolean(businessId),
    })
}
