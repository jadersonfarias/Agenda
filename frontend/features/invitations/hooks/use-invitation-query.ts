'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchInvitation } from '../invitation-api.service'

export function useInvitationQuery(token?: string) {
    return useQuery({
        queryKey: ['invitation', token],
        queryFn: () => fetchInvitation(token!),
        enabled: Boolean(token),
        retry: false,
    })
}
