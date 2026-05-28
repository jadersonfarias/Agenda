'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminInvitations } from '../services/admin-api.service'

export function useAdminInvitationsQuery(businessId?: string, enabled = true, page = 1, perPage = 20) {
    return useQuery({
        queryKey: ['admin-invitations', businessId, page, perPage],
        queryFn: () => fetchAdminInvitations(businessId!, page, perPage),
        enabled: enabled && Boolean(businessId),
    })
}
