import { api, getApiErrorMessage } from '../../../lib/api'
import {
    type AdminAppointmentItem,
    type AdminAppointmentStatus,
    type AdminAppointmentStatusFilter,
    type AdminBusinessSettings,
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
        const response = await api.patch<AdminBusinessSettings>('/admin/business', input)
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
        const response = await api.get<AdminAppointmentItem[] | PaginatedResponse<AdminAppointmentItem>>('/appointments', {
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
            `/appointments/${input.appointmentId}/status`,
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
