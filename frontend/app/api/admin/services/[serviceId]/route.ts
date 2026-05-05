import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../../lib/auth'
import { updateAdminService } from '../../../../../features/admin/services/admin.service'
import { prisma } from '../../../../../lib/prisma'

type MembershipRole = 'OWNER' | 'ADMIN' | 'STAFF'

type AccessTokenPayload = {
    memberships?: Array<{
        businessId: string
        role: MembershipRole
    }>
}

function getAccessTokenPayload(accessToken: string): AccessTokenPayload {
    const [, encodedPayload] = accessToken.split('.')

    if (!encodedPayload) {
        throw new Error('Token inválido')
    }

    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as AccessTokenPayload
}

function hasBusinessRole(accessToken: string, businessId: string, allowedRoles: MembershipRole[]) {
    const payload = getAccessTokenPayload(accessToken)

    return (
        payload.memberships?.some(
            (membership) =>
                membership.businessId === businessId && allowedRoles.includes(membership.role),
        ) ?? false
    )
}

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

    if (!session?.user?.id || !session.accessToken) {
        return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    try {
        const { serviceId } = await context.params
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                _count: {
                    select: {
                        appointments: true,
                    },
                },
            },
        })

        if (!service) {
            return NextResponse.json({ message: 'Serviço não encontrado' }, { status: 404 })
        }

        if (!hasBusinessRole(session.accessToken, service.businessId, ['OWNER'])) {
            return NextResponse.json({ message: 'Sem permissão para deletar serviço' }, { status: 403 })
        }

        if (service._count.appointments > 0) {
            return NextResponse.json(
                { message: 'Este serviço possui agendamentos e não pode ser removido' },
                { status: 400 },
            )
        }

        await prisma.service.delete({
            where: { id: serviceId },
        })

        revalidatePath('/admin')

        return NextResponse.json({ success: true })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno'
        return NextResponse.json({ message }, { status: 400 })
    }
}
