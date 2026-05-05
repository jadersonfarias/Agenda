import { createServerApi, getServerApiErrorMessage } from '../../../lib/server-api'
import { type AdminDashboardData } from '../types'

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
