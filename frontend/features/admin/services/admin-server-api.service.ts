import { createServerApi, getServerApiErrorMessage } from '../../../lib/server-api'
import { type AdminAppointmentItem, type AdminDashboardData } from '../types'

export async function fetchAdminDashboard(accessToken: string, businessId: string): Promise<AdminDashboardData> {
    try {
        const serverApi = createServerApi(accessToken)
        const response = await serverApi.get<AdminDashboardData>('/admin/dashboard', {
            params: { businessId },
        })

        return response.data
    } catch (error) {
        throw new Error(getServerApiErrorMessage(error, 'Não foi possível carregar o painel administrativo'))
    }
}

export async function fetchAdminAppointmentsServer(
    accessToken: string,
    businessId: string,
    statusFilter: 'scheduled' | 'completed' | 'canceled' | 'all' = 'scheduled'
): Promise<AdminAppointmentItem[]> {
    try {
        const serverApi = createServerApi(accessToken)
        const response = await serverApi.get<AdminAppointmentItem[]>('/admin/appointments', {
            params: { businessId, statusFilter },
        })

        return response.data
    } catch (error) {
        throw new Error(getServerApiErrorMessage(error, 'Não foi possível carregar os agendamentos'))
    }
}
