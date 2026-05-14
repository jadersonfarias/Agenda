import { PublicBookingPage } from '../components/public/PublicBookingPage'
import { createServerApi } from '../lib/server-api'

type PublicBusinessResponse = {
    id: string
    name: string
    slug: string
    openTime?: string
    closeTime?: string
}

const defaultBusinessId = process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_ID || 'default-business'

export default async function Home() {
    const api = createServerApi()

    try {
        const response = await api.get<PublicBusinessResponse>(`/businesses/${encodeURIComponent(defaultBusinessId)}`)

        return (
            <PublicBookingPage
                businessId={response.data.id}
                businessSlug={response.data.slug}
                businessName={response.data.name}
                businessOpenTime={response.data.openTime}
                businessCloseTime={response.data.closeTime}
            />
        )
    } catch {
        return <PublicBookingPage businessId={defaultBusinessId} />
    }
}
