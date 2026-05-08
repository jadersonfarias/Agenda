import { PublicAppointmentPage } from '../../../components/public/PublicAppointmentPage'

type PublicAppointmentRouteProps = {
    params: Promise<{
        token: string
    }>
}

export default async function AppointmentByTokenPage({ params }: PublicAppointmentRouteProps) {
    const { token } = await params

    return <PublicAppointmentPage token={token} />
}
