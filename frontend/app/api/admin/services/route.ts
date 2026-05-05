import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import { listAdminServices } from '../../../../features/admin/services/admin.service'
import { serviceFormSchema } from '../../../../features/admin/schemas'
import { prisma } from '../../../../lib/prisma'

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

function getMembershipByRoles(accessToken: string, allowedRoles: MembershipRole[]) {
    const payload = getAccessTokenPayload(accessToken)

    return (
        payload.memberships?.find((membership) => allowedRoles.includes(membership.role)) ?? null
    )
}

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    try {
        const services = await listAdminServices(session.user.id)
        return NextResponse.json(services)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno'
        return NextResponse.json({ message }, { status: 400 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session.accessToken) {
        return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const membership = getMembershipByRoles(session.accessToken, ['OWNER', 'ADMIN'])

        if (!membership) {
            return NextResponse.json({ message: 'Sem permissão para criar serviço' }, { status: 403 })
        }

        const data = serviceFormSchema.parse(body)

        const service = await prisma.service.create({
            data: {
                businessId: membership.businessId,
                name: data.name,
                price: data.price,
                durationMinutes: data.durationMinutes,
            },
        })

        revalidatePath('/admin')

        return NextResponse.json(service, { status: 201 })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno'
        return NextResponse.json({ message }, { status: 400 })
    }
}
