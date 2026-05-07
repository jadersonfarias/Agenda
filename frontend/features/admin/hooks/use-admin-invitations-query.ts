'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminInvitations } from '../services/admin-api.service'

export function useAdminInvitationsQuery(businessId?: string, enabled = true) {
    return useQuery({
        queryKey: ['admin-invitations', businessId],
        queryFn: () => fetchAdminInvitations(businessId!),
        enabled: enabled && Boolean(businessId),
    })
}
