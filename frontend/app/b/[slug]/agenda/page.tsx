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

function formatSlugLabel(slug: string) {
    return slug
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

export default async function BusinessAgendaPage({ params }: BusinessAgendaPageProps) {
    const { slug } = await params
    const api = createServerApi()

    try {
        const response = await api.get<AppointmentResponseItem[]>('/appointments', {
            params: {
                businessId: slug,
                statusFilter: 'active',
            },
        })

        return (
            <PublicAgendaPage
                businessSlug={slug}
                headline={formatSlugLabel(slug) || 'Agenda pública'}
                appointments={response.data}
            />
        )
    } catch (error) {
        return (
            <PublicAgendaPage
                businessSlug={slug}
                headline={formatSlugLabel(slug) || 'Agenda pública'}
                appointments={[]}
                errorMessage={getServerApiErrorMessage(error, 'Não foi possível carregar a agenda pública agora.')}
            />
        )
    }
}
