import { type AdminAppointmentItem, type AdminAppointmentStatus, type AdminMonthlySummary, type AdminServiceItem } from '../types'

export async function fetchAdminServices() {
    const response = await fetch('/api/admin/services', {
        method: 'GET',
        credentials: 'same-origin',
    })

    const payload = (await response.json().catch(() => null)) as
        | AdminServiceItem[]
        | { message?: string }
        | null

    if (!response.ok) {
        const message =
            payload && !Array.isArray(payload) ? payload.message : undefined

        throw new Error(message || 'Não foi possível carregar os serviços')
    }

    return Array.isArray(payload) ? payload : []
}

export async function fetchAdminMonthlySummary(month: string) {
    const response = await fetch(`/api/admin/financial-summary?month=${encodeURIComponent(month)}`, {
        method: 'GET',
        credentials: 'same-origin',
    })

    const payload = (await response.json().catch(() => null)) as
        | AdminMonthlySummary
        | { message?: string }
        | null

    if (!response.ok) {
        const message = payload && !Array.isArray(payload) && 'message' in payload ? payload.message : undefined
        throw new Error(message || 'Não foi possível carregar o resumo financeiro')
    }

    if (!payload || Array.isArray(payload) || !('month' in payload)) {
        throw new Error('Resposta inválida do resumo financeiro')
    }

    return payload
}

export async function fetchAdminAppointments(businessId: string) {
    const response = await fetch(`/api/admin/appointments?businessId=${encodeURIComponent(businessId)}`, {
        method: 'GET',
        credentials: 'same-origin',
    })

    const payload = (await response.json().catch(() => null)) as
        | AdminAppointmentItem[]
        | { message?: string }
        | null

    if (!response.ok) {
        const message = payload && !Array.isArray(payload) ? payload.message : undefined
        throw new Error(message || 'Não foi possível carregar os agendamentos')
    }

    return Array.isArray(payload) ? payload : []
}

export async function updateAdminAppointmentStatus(input: {
    appointmentId: string
    businessId: string
    status: AdminAppointmentStatus
}) {
    const response = await fetch(`/api/admin/appointments/${input.appointmentId}/status`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            businessId: input.businessId,
            status: input.status,
        }),
    })

    const payload = (await response.json().catch(() => null)) as
        | { id: string; status: AdminAppointmentStatus; message?: string }
        | { message?: string }
        | null

    if (!response.ok) {
        const message = payload && !Array.isArray(payload) && 'message' in payload ? payload.message : undefined
        throw new Error(message || 'Não foi possível atualizar o status do agendamento')
    }

    if (!payload || Array.isArray(payload) || !('id' in payload) || !('status' in payload)) {
        throw new Error('Resposta inválida ao atualizar status do agendamento')
    }

    return payload
}
