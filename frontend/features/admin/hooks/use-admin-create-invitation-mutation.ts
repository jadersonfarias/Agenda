'use client'

import { useMutation } from '@tanstack/react-query'
import { createAdminInvitation } from '../services/admin-api.service'

export function useAdminCreateInvitationMutation() {
    return useMutation({
        mutationFn: createAdminInvitation,
    })
}
