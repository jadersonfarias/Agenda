'use client'

import { useMutation } from '@tanstack/react-query'
import { deleteAdminMembership } from '../services/admin-api.service'

export function useAdminDeleteMembershipMutation() {
    return useMutation({
        mutationFn: deleteAdminMembership,
    })
}
