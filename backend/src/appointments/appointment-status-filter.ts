export const appointmentStatusFilterValues = ['scheduled', 'completed', 'canceled', 'all'] as const

export type AppointmentStatusFilter = (typeof appointmentStatusFilterValues)[number]

export function normalizeAppointmentStatusFilter(
  statusFilter?: string | null
): AppointmentStatusFilter | null {
  if (statusFilter === undefined || statusFilter === null || statusFilter === '') {
    return 'all'
  }

  if (statusFilter === 'active') {
    return 'scheduled'
  }

  if (appointmentStatusFilterValues.includes(statusFilter as AppointmentStatusFilter)) {
    return statusFilter as AppointmentStatusFilter
  }

  return null
}
