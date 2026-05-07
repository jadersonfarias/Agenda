import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import AdminPanel from '../../components/admin/AdminPanel'
import { fetchAdminDashboard } from '../../features/admin/services/admin-server-api.service'
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

    const initialData = await fetchAdminDashboard(session.accessToken, businessId)

    return (
        <AdminPanel
            initialData={initialData}
            businesses={availableBusinesses}
            currentBusinessId={businessId}
        />
    )
}
