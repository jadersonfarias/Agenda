import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import AdminPanel from '../../components/admin/AdminPanel'
import { getAdminDashboardData } from '../../features/admin/services/admin.service'
import { authOptions } from '../../lib/auth'

export default async function AdminPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect('/login')
    }

    const initialData = await getAdminDashboardData(session.user.id)

    return <AdminPanel initialData={initialData} />
}
