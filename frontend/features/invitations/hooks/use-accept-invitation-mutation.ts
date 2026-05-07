'use client'

import { useMutation } from '@tanstack/react-query'
import { acceptInvitation } from '../invitation-api.service'

export function useAcceptInvitationMutation() {
    return useMutation({
        mutationFn: acceptInvitation,
    })
}
