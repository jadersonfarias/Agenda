'use client'

import { useMutation } from '@tanstack/react-query'
import { updatePlatformBusinessSubscription } from '../services/platform-api.service'

export function usePlatformUpdateBusinessSubscriptionMutation() {
  return useMutation({
    mutationFn: updatePlatformBusinessSubscription,
  })
}
