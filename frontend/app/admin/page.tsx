import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import AdminPanel from '../../components/admin/AdminPanel'
import {
    fetchAdminAppointmentsServer,
    fetchAdminDashboard,
} from '../../features/admin/services/admin-server-api.service'
import { authOptions } from '../../lib/auth'

type AdminPageProps = {
    searchParams?: Promise<{
        businessId?: string
    }>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
        redirect('/login')
    }

    const resolvedSearchParams = searchParams ? await searchParams : undefined
    const businessId =
        resolvedSearchParams?.businessId ??
        session.currentBusinessId ??
        session.businesses?.[0]?.id

    if (!businessId) {
        redirect('/login')
    }

    const availableBusinesses = session.businesses ?? []
    const hasAccessToBusiness = availableBusinesses.some((business) => business.id === businessId)

    if (!hasAccessToBusiness) {
        redirect('/admin')
    }

    const [initialData, initialAppointments] = await Promise.all([
        fetchAdminDashboard(session.accessToken, businessId),
        fetchAdminAppointmentsServer(session.accessToken, businessId, 'scheduled'),
    ])

    return (
        <AdminPanel
            initialData={initialData}
            initialAppointments={initialAppointments}
            businesses={availableBusinesses}
            currentBusinessId={businessId}
        />
    )
}
