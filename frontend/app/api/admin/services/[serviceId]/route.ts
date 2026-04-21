import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../../lib/auth'
import { deleteAdminService, updateAdminService } from '../../../../../features/admin/services/admin.service'

type RouteContext = {
    params: Promise<{
        serviceId: string
    }>
}

export async function PATCH(request: Request, context: RouteContext) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { serviceId } = await context.params
        const service = await updateAdminService(session.user.id, serviceId, body)
        return NextResponse.json(service)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno'
        return NextResponse.json({ message }, { status: 400 })
    }
}

export async function DELETE(_: Request, context: RouteContext) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    try {
        const { serviceId } = await context.params
        await deleteAdminService(session.user.id, serviceId)
        return NextResponse.json({ success: true })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno'
        return NextResponse.json({ message }, { status: 400 })
    }
}
