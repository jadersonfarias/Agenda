import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import AdminPanel from '../../components/admin/AdminPanel'
import { fetchAdminDashboard } from '../../features/admin/services/admin-server-api.service'
import { getPrimaryBusinessId } from '../../lib/access-token'
import { authOptions } from '../../lib/auth'

export default async function AdminPage() {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
        redirect('/login')
    }

    const businessId = getPrimaryBusinessId(session.accessToken)

    if (!businessId) {
        redirect('/login')
    }

    const initialData = await fetchAdminDashboard(session.accessToken, businessId)

    return <AdminPanel initialData={initialData} />
}
