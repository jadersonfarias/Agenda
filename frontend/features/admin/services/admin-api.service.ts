import { api, getApiErrorMessage } from '../../../lib/api'
import {
    type AdminAppointmentItem,
    type AdminAppointmentStatus,
    type AdminAppointmentStatusFilter,
    type AdminBusinessSettings,
    type AdminDashboardData,
    type AdminInvitationItem,
    type AdminMembershipItem,
    type AdminMembershipRole,
    type AdminMonthlySummary,
    type AdminServiceItem,
} from '../types'

type PaginatedResponse<T> = {
    data: T[]
}

function normalizeAdminServices(payload: AdminServiceItem[] | PaginatedResponse<AdminServiceItem>) {
    return Array.isArray(payload) ? payload : payload.data
}

function formatMoney(value: string | number) {
    return typeof value === 'number' ? value.toFixed(2) : value
}

function normalizeMonthlySummary(payload: Omit<AdminMonthlySummary, 'totalRevenue' | 'averageTicket'> & {
    totalRevenue: string | number
    averageTicket: string | number
}) {
    return {
        ...payload,
        totalRevenue: formatMoney(payload.totalRevenue),
        averageTicket: formatMoney(payload.averageTicket),
    }
}

export async function fetchAdminDashboard(businessId: string) {
    try {
        const response = await api.get<AdminDashboardData>('/admin/dashboard', {
            params: { businessId },
        })

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível carregar o painel administrativo'))
    }
}

export async function fetchAdminServices(businessId: string) {
    try {
        const response = await api.get<AdminServiceItem[] | PaginatedResponse<AdminServiceItem>>('/admin/services', {
            params: { businessId },
        })

        return normalizeAdminServices(response.data)
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível carregar os serviços'))
    }
}

export async function fetchAdminMemberships(businessId: string) {
    try {
        const response = await api.get<AdminMembershipItem[]>('/admin/memberships', {
            params: { businessId },
        })

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível carregar os membros'))
    }
}

export async function fetchAdminInvitations(businessId: string) {
    try {
        const response = await api.get<AdminInvitationItem[]>('/admin/invitations', {
            params: { businessId },
        })

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível carregar os convites'))
    }
}

export async function createAdminInvitation(input: {
    businessId: string
    email: string
    role: AdminMembershipRole
}) {
    try {
        const response = await api.post<AdminInvitationItem>('/admin/invitations', input)

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível criar o convite'))
    }
}

export async function createAdminMembership(input: {
    businessId: string
    email: string
    role: AdminMembershipRole
}) {
    try {
        const response = await api.post<AdminMembershipItem>('/admin/memberships', input)

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível adicionar o membro'))
    }
}

export async function updateAdminMembershipRole(input: {
    businessId: string
    membershipId: string
    role: AdminMembershipRole
}) {
    try {
        const response = await api.patch<AdminMembershipItem>(`/admin/memberships/${input.membershipId}`, {
            businessId: input.businessId,
            role: input.role,
        })

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível atualizar a role do membro'))
    }
}

export async function deleteAdminMembership(input: {
    businessId: string
    membershipId: string
}) {
    try {
        const response = await api.delete<{ success: boolean }>(`/admin/memberships/${input.membershipId}`, {
            params: { businessId: input.businessId },
        })

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível remover o membro'))
    }
}

export async function createAdminService(input: {
    businessId: string
    name: string
    price: number
    durationMinutes: number
}) {
    try {
        const response = await api.post<AdminServiceItem>('/admin/services', input)
        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível criar o serviço'))
    }
}

export async function updateAdminService(input: {
    businessId: string
    serviceId: string
    name: string
    price: number
    durationMinutes: number
}) {
    try {
        const response = await api.patch<AdminServiceItem>(`/admin/services/${input.serviceId}`, {
            businessId: input.businessId,
            name: input.name,
            price: input.price,
            durationMinutes: input.durationMinutes,
        })

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível atualizar o serviço'))
    }
}

export async function deleteAdminService(input: { businessId: string; serviceId: string }) {
    try {
        const response = await api.delete<{ success: boolean }>(`/admin/services/${input.serviceId}`, {
            params: { businessId: input.businessId },
        })

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível remover o serviço'))
    }
}

export async function updateAdminAvailability(input: {
    businessId: string
    openTime: string
    closeTime: string
}) {
    try {
        const response = await api.patch<AdminBusinessSettings>('/admin/business/availability', input)
        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível atualizar os horários'))
    }
}

export async function fetchAdminMonthlySummary(businessId: string, month: string) {
    try {
        const response = await api.get<AdminMonthlySummary>('/admin/financial-summary', {
            params: { businessId, month },
        })

        return normalizeMonthlySummary(response.data)
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível carregar o resumo financeiro'))
    }
}

export async function fetchAdminAppointments(businessId: string, statusFilter: AdminAppointmentStatusFilter = 'active') {
    try {
        const response = await api.get<AdminAppointmentItem[] | PaginatedResponse<AdminAppointmentItem>>('/admin/appointments', {
            params: {
                businessId,
                statusFilter,
            },
        })

        return Array.isArray(response.data) ? response.data : response.data.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível carregar os agendamentos'))
    }
}

export async function updateAdminAppointmentStatus(input: {
    appointmentId: string
    businessId: string
    status: AdminAppointmentStatus
}) {
    try {
        const response = await api.patch<{ id: string; status: AdminAppointmentStatus }>(
            `/admin/appointments/${input.appointmentId}/status`,
            { status: input.status },
            {
                params: { businessId: input.businessId },
            }
        )

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível atualizar o status do agendamento'))
    }
}
