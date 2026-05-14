import { PublicBookingPage } from '../../../components/public/PublicBookingPage'
import { createServerApi } from '../../../lib/server-api'

type BusinessSlugPageProps = {
    params: Promise<{
        slug: string
    }>
}

type PublicBusinessResponse = {
    id: string
    name: string
    slug: string
    openTime?: string
    closeTime?: string
}

export default async function BusinessSlugPage({ params }: BusinessSlugPageProps) {
    const { slug } = await params
    const api = createServerApi()

    try {
        const response = await api.get<PublicBusinessResponse>(`/businesses/slug/${encodeURIComponent(slug)}`)

        return (
            <PublicBookingPage
                businessId={response.data.id}
                businessSlug={response.data.slug}
                businessName={response.data.name}
                businessOpenTime={response.data.openTime}
                businessCloseTime={response.data.closeTime}
                headline={response.data.name || 'Agenda pública'}
                eyebrow="Reserva por negócio"
            />
        )
    } catch {
        return (
            <PublicBookingPage
                businessId={slug}
                businessSlug={slug}
                headline="Agenda pública"
                eyebrow="Reserva por negócio"
            />
        )
    }
}
