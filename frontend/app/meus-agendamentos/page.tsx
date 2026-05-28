import { PublicCustomerAppointmentsPage } from '../../components/public/PublicCustomerAppointmentsPage'

type MyAppointmentsPageProps = {
    searchParams?: Promise<{
        businessId?: string | string[]
    }>
}

export default async function MyAppointmentsPage({ searchParams }: MyAppointmentsPageProps) {
    const resolvedSearchParams = await searchParams
    const businessIdParam = resolvedSearchParams?.businessId
    const businessId = Array.isArray(businessIdParam) ? businessIdParam[0] : businessIdParam

    return <PublicCustomerAppointmentsPage businessId={businessId} />
}
