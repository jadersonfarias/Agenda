import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const businessId = searchParams.get('businessId')

        if (!businessId) {
            return NextResponse.json({ message: 'businessId é obrigatório' }, { status: 400 })
        }

        const response = await fetch(`${apiBaseUrl}/appointments?businessId=${encodeURIComponent(businessId)}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
            cache: 'no-store',
        })

        const payload = await response.json().catch(() => null)

        if (!response.ok) {
            const message =
                payload && typeof payload === 'object' && 'message' in payload
                    ? String(payload.message)
                    : 'Não foi possível carregar os agendamentos'

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
