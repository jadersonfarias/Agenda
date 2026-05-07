'use client'

import { useMutation } from '@tanstack/react-query'
import { createAdminMembership } from '../services/admin-api.service'

export function useAdminCreateMembershipMutation() {
    return useMutation({
        mutationFn: createAdminMembership,
    })
}
