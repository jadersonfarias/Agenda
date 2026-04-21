'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminAppointments } from '../services/admin-api.service'

export function useAdminAppointmentsQuery(businessId?: string, enabled = true) {
    return useQuery({
        queryKey: ['admin-appointments', businessId],
        queryFn: () => fetchAdminAppointments(businessId!),
        enabled: enabled && Boolean(businessId),
    })
}
