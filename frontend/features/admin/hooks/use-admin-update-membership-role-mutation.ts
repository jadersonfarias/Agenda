'use client'

import { useMutation } from '@tanstack/react-query'
import { updateAdminMembershipRole } from '../services/admin-api.service'

export function useAdminUpdateMembershipRoleMutation() {
    return useMutation({
        mutationFn: updateAdminMembershipRole,
    })
}
