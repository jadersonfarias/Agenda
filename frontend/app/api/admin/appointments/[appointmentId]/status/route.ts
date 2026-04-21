import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../../../lib/auth'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

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
