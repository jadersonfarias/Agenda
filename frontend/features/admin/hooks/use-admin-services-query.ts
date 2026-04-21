'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminServices } from '../services/admin-api.service'

export function useAdminServicesQuery(accessToken?: string) {
    return useQuery({
        queryKey: ['admin-services', accessToken],
        queryFn: fetchAdminServices,
        enabled: Boolean(accessToken),
    })
}
