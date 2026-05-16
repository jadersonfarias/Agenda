'use client'

import { useMutation } from '@tanstack/react-query'
import { updatePlatformBusinessSubscriptionStatus } from '../services/platform-api.service'

export function usePlatformUpdateBusinessSubscriptionStatusMutation() {
  return useMutation({
    mutationFn: updatePlatformBusinessSubscriptionStatus,
  })
}
