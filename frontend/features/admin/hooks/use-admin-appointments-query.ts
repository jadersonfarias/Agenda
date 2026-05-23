'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAdminAppointments } from '../services/admin-api.service'
import { type AdminAppointmentItem, type AdminAppointmentStatusFilter } from '../types'

export function getAdminAppointmentsQueryKey(
    businessId?: string,
    statusFilter: AdminAppointmentStatusFilter = 'scheduled',
    assignedToUserId?: string
) {
    return ['admin-appointments', businessId ?? null, statusFilter, assignedToUserId ?? null] as const
}

export function getAdminAppointmentsQueryBusinessKey(businessId?: string) {
    return ['admin-appointments', businessId ?? null] as const
}

export function useAdminAppointmentsQuery(
    businessId?: string,
    statusFilter: AdminAppointmentStatusFilter = 'scheduled',
    enabled = true,
    initialData?: AdminAppointmentItem[],
    assignedToUserId?: string
) {
    return useQuery({
        queryKey: getAdminAppointmentsQueryKey(businessId, statusFilter, assignedToUserId),
        queryFn: () => fetchAdminAppointments(businessId!, statusFilter, assignedToUserId),
        enabled: enabled && Boolean(businessId),
        initialData,
    })
}
