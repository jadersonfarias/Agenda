import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../../../lib/auth'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

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
        appointmentId: string
    }>
}

export async function PATCH(request: Request, context: RouteContext) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session.accessToken) {
        return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    try {
        const body = (await request.json().catch(() => null)) as { businessId?: string; status?: string } | null
        const businessId = body?.businessId

        if (!businessId || !body?.status) {
            return NextResponse.json({ message: 'businessId e status são obrigatórios' }, { status: 400 })
        }

        if (!hasBusinessRole(session.accessToken, businessId, ['OWNER', 'ADMIN', 'STAFF'])) {
            return NextResponse.json({ message: 'Sem permissão para atualizar status' }, { status: 403 })
        }

        const { appointmentId } = await context.params
        const response = await fetch(`${apiBaseUrl}/appointments/${appointmentId}/status?businessId=${encodeURIComponent(businessId)}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({ status: body.status }),
            cache: 'no-store',
        })

        const payload = await response.json().catch(() => null)

        if (!response.ok) {
            const message =
                payload && typeof payload === 'object' && 'message' in payload
                    ? String(payload.message)
                    : 'Não foi possível atualizar o status do agendamento'

            return NextResponse.json({ message }, { status: response.status })
        }

        return NextResponse.json(payload)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno'
        const status = message.toLowerCase().includes('fetch failed') ? 503 : 500
        const responseMessage =
            status === 503
                ? 'Backend de agendamentos indisponível. Verifique se o servidor Nest está rodando em NEXT_PUBLIC_API_URL.'
                : message

        return NextResponse.json({ message: responseMessage }, { status })
    }
}
