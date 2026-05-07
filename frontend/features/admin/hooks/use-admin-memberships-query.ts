'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminMemberships } from '../services/admin-api.service'

export function useAdminMembershipsQuery(businessId?: string, enabled = true) {
    return useQuery({
        queryKey: ['admin-memberships', businessId],
        queryFn: () => fetchAdminMemberships(businessId!),
        enabled: enabled && Boolean(businessId),
    })
}
