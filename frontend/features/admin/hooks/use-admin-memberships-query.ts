'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminMemberships } from '../services/admin-api.service'

export function useAdminMembershipsQuery(businessId?: string, enabled = true, page = 1, perPage = 20) {
    return useQuery({
        queryKey: ['admin-memberships', businessId, page, perPage],
        queryFn: () => fetchAdminMemberships(businessId!, page, perPage),
        enabled: enabled && Boolean(businessId),
    })
}
