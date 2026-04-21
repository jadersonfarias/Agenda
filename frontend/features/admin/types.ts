export type AdminServiceItem = {
    id: string
    name: string
    price: string
    durationMinutes: number
    appointmentCount: number
    createdAt: string
}

export type AdminBusinessSettings = {
    id: string
    name: string
    slug: string
    openTime: string
    closeTime: string
}

export type AdminDashboardData = {
    business: AdminBusinessSettings
    services: AdminServiceItem[]
}

export type AdminMonthlySummary = {
    month: string
    totalRevenue: string
    completedAppointments: number
    averageTicket: string
    activeCustomers: number
    inactiveCustomers: number
    activeCustomerWindowDays: number
}

export type AdminAppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELED'

export type AdminAppointmentItem = {
    id: string
    scheduledAt: string
    completedAt: string | null
    status: AdminAppointmentStatus
    price: string
    service: {
        id: string
        name: string
    }
    customer: {
        id: string
        name: string
        phone: string
    }
}
