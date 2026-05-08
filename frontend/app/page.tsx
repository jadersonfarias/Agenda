import { PublicBookingPage } from '../components/public/PublicBookingPage'

const defaultBusinessId = process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_ID || 'default-business'

export default function Home() {
    return <PublicBookingPage businessId={defaultBusinessId} />
}
