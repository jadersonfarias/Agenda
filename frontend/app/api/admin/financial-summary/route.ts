import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import { getAdminMonthlySummary } from '../../../../features/admin/services/admin.service'

function getErrorResponse(error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    const normalizedMessage = message.toLowerCase()

    if (message === 'month deve estar no formato YYYY-MM' || message === 'month inválido') {
        return NextResponse.json({ message }, { status: 400 })
    }

    if (
        normalizedMessage.includes('column') ||
        normalizedMessage.includes('completedat') ||
        normalizedMessage.includes('lastvisitat') ||
        normalizedMessage.includes('migration')
    ) {
        return NextResponse.json(
            {
                message: 'O banco ainda não está atualizado para o resumo financeiro. Aplique as migrations mais recentes.',
            },
            { status: 500 }
        )
    }

    return NextResponse.json({ message }, { status: 500 })
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const month = searchParams.get('month') ?? undefined
        const summary = await getAdminMonthlySummary(session.user.id, month)
        return NextResponse.json(summary)
    } catch (error) {
        return getErrorResponse(error)
    }
}
