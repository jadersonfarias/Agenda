'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminAppointments } from '../services/admin-api.service'
import { type AdminAppointmentItem, type AdminAppointmentStatusFilter } from '../types'

export function getAdminAppointmentsQueryKey(
    businessId?: string,
    statusFilter: AdminAppointmentStatusFilter = 'scheduled'
) {
    return ['admin-appointments', businessId ?? null, statusFilter] as const
}

export function getAdminAppointmentsQueryBusinessKey(businessId?: string) {
    return ['admin-appointments', businessId ?? null] as const
}

export function useAdminAppointmentsQuery(
    businessId?: string,
    statusFilter: AdminAppointmentStatusFilter = 'scheduled',
    enabled = true,
    initialData?: AdminAppointmentItem[]
) {
    return useQuery({
        queryKey: getAdminAppointmentsQueryKey(businessId, statusFilter),
        queryFn: () => fetchAdminAppointments(businessId!, statusFilter),
        enabled: enabled && Boolean(businessId),
        initialData,
    })
}
