'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminServices } from '../services/admin-api.service'

export function useAdminServicesQuery(businessId?: string, enabled = true) {
    return useQuery({
        queryKey: ['admin-services', businessId],
        queryFn: () => fetchAdminServices(businessId!),
        enabled: enabled && Boolean(businessId),
    })
}
