import { PublicBookingPage } from '../../../components/public/PublicBookingPage'

type BusinessSlugPageProps = {
    params: Promise<{
        slug: string
    }>
}

function formatSlugLabel(slug: string) {
    return slug
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

export default async function BusinessSlugPage({ params }: BusinessSlugPageProps) {
    const { slug } = await params

    return (
        <PublicBookingPage
            businessId={slug}
            headline={formatSlugLabel(slug) || 'Agenda pública'}
            eyebrow="Reserva por negócio"
        />
    )
}
