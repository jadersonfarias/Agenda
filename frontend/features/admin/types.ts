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
    plan: 'FREE' | 'BASIC' | 'PRO'
    subscriptionStatus: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
    trialEndsAt: string | null
}

export type AdminBusinessOption = {
    id: string
    name: string
    slug: string
    role: 'OWNER' | 'ADMIN' | 'STAFF'
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

export type AdminFinancialReportServiceItem = {
    serviceId: string
    serviceName: string
    revenueTotal: string
    appointmentsCompleted: number
}

export type AdminFinancialReport = {
    month: string
    revenueTotal: string
    appointmentsCompleted: number
    averageTicket: string
    cancellationsCount: number
    revenueByService: AdminFinancialReportServiceItem[]
    topServices: AdminFinancialReportServiceItem[]
}

export type AdminAppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELED'
export type AdminAppointmentStatusFilter = 'active' | 'completed' | 'all'

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

export type AdminMembershipRole = 'OWNER' | 'ADMIN' | 'STAFF'

export type AdminMembershipItem = {
    id: string
    role: AdminMembershipRole
    createdAt: string
    updatedAt: string
    user: {
        id: string
        name: string
        email: string
    }
}

export type AdminInvitationItem = {
    id: string
    email: string
    role: AdminMembershipRole
    token: string
    invitationLink: string
    expiresAt: string
    acceptedAt: string | null
    createdAt: string
    isExpired: boolean
}
