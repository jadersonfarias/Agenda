'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminAppointments } from '../services/admin-api.service'
import { type AdminAppointmentStatusFilter } from '../types'

export function useAdminAppointmentsQuery(
    businessId?: string,
    statusFilter: AdminAppointmentStatusFilter = 'active',
    enabled = true
) {
    return useQuery({
        queryKey: ['admin-appointments', businessId, statusFilter],
        queryFn: () => fetchAdminAppointments(businessId!, statusFilter),
        enabled: enabled && Boolean(businessId),
    })
}
