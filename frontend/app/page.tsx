import { PublicLandingPage } from '../components/public/PublicLandingPage'
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
        const demoBookingHref = `/b/${encodeURIComponent(response.data.slug)}`
        const demoBusinessHoursLabel =
            response.data.openTime && response.data.closeTime
                ? `${response.data.openTime} às ${response.data.closeTime}`
                : undefined

        return <PublicLandingPage demoBookingHref={demoBookingHref} demoBusinessName={response.data.name} demoBusinessHoursLabel={demoBusinessHoursLabel} />
    } catch {
        return <PublicLandingPage demoBookingHref="/b/default-business" demoBusinessName="Agenda de demonstração" />
    }
}
