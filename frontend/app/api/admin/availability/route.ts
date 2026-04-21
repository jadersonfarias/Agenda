import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import { updateAdminAvailability } from '../../../../features/admin/services/admin.service'

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const availability = await updateAdminAvailability(session.user.id, body)
        return NextResponse.json(availability)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno'
        return NextResponse.json({ message }, { status: 400 })
    }
}
