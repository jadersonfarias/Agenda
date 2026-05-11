import { PublicAgendaPage } from '../../../../components/public/PublicAgendaPage'
import { createServerApi, getServerApiErrorMessage } from '../../../../lib/server-api'

type BusinessAgendaPageProps = {
    params: Promise<{
        slug: string
    }>
}

type AppointmentResponseItem = {
    id: string
    scheduledAt: string
    service: {
        name: string
    }
    customer: {
        name: string
    }
}

type PublicBusinessResponse = {
    id: string
    name: string
    slug: string
}

export default async function BusinessAgendaPage({ params }: BusinessAgendaPageProps) {
    const { slug } = await params
    const api = createServerApi()

    try {
        const businessResponse = await api.get<PublicBusinessResponse>(`/businesses/slug/${encodeURIComponent(slug)}`)
        const response = await api.get<AppointmentResponseItem[]>('/appointments', {
            params: {
                businessId: businessResponse.data.id,
                statusFilter: 'active',
            },
        })

        return (
            <PublicAgendaPage
                businessSlug={slug}
                headline={businessResponse.data.name || 'Agenda pública'}
                appointments={response.data}
            />
        )
    } catch (error) {
        return (
            <PublicAgendaPage
                businessSlug={slug}
                headline="Agenda pública"
                appointments={[]}
                errorMessage={getServerApiErrorMessage(error, 'Não foi possível carregar a agenda pública agora.')}
            />
        )
    }
}
