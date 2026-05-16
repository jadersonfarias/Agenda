'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchPlatformBusinesses } from '../services/platform-api.service'

export function usePlatformBusinessesQuery(page = 1, perPage = 20, enabled = true) {
  return useQuery({
    queryKey: ['platform-businesses', page, perPage],
    queryFn: () => fetchPlatformBusinesses(page, perPage),
    enabled,
  })
}
