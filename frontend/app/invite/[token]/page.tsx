'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { useAcceptInvitationMutation } from '../../../features/invitations/hooks/use-accept-invitation-mutation'
import { useInvitationQuery } from '../../../features/invitations/hooks/use-invitation-query'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'

const acceptInvitationSchema = z.object({
    name: z.string().trim().optional(),
    password: z.string().optional(),
}).superRefine((value, context) => {
    const hasName = Boolean(value.name?.trim())
    const hasPassword = Boolean(value.password)

    if ((hasName || hasPassword) && !hasName) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['name'],
            message: 'Informe seu nome completo',
        })
    }

    if ((hasName || hasPassword) && !hasPassword) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['password'],
            message: 'Informe uma senha',
        })
    }

    if (value.password && value.password.length < 6) {
        context.addIssue({
            code: z.ZodIssueCode.too_small,
            path: ['password'],
            minimum: 6,
            inclusive: true,
            type: 'string',
            message: 'A senha deve ter pelo menos 6 caracteres',
        })
    }
})

type AcceptInvitationForm = z.infer<typeof acceptInvitationSchema>

function roleLabel(role: 'OWNER' | 'ADMIN' | 'STAFF') {
    if (role === 'OWNER') return 'Owner'
    if (role === 'ADMIN') return 'Admin'
    return 'Staff'
}

export default function InvitePage() {
    const params = useParams<{ token: string }>()
    const router = useRouter()
    const token = typeof params?.token === 'string' ? params.token : undefined
    const invitationDetailsQuery = useInvitationQuery(token)
    const acceptInvitationMutation = useAcceptInvitationMutation()
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AcceptInvitationForm>({
        resolver: zodResolver(acceptInvitationSchema),
        defaultValues: {
            name: '',
            password: '',
        },
    })
    const invitation = invitationDetailsQuery.data

    const onSubmit = handleSubmit(async (values) => {
        if (!token) {
            toast.error('Convite inválido')
            return
        }

        try {
            await acceptInvitationMutation.mutateAsync({
                token,
                name: invitation?.userExists ? undefined : values.name?.trim(),
                password: invitation?.userExists ? undefined : values.password,
            })

            toast.success('Convite aceito com sucesso')
            router.push('/login')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Não foi possível aceitar o convite')
        }
    })

    return (
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
            <Card>
                {invitationDetailsQuery.isLoading ? (
                    <div className="space-y-4">
                        <p className="text-sm uppercase tracking-[.3em] text-purple-700">Convite</p>
                        <h1 className="text-3xl font-semibold text-slate-900">Carregando convite...</h1>
                        <p className="text-slate-600">Estamos validando o link e buscando os dados do negócio.</p>
                    </div>
                ) : invitationDetailsQuery.isError ? (
                    <div className="space-y-4">
                        <p className="text-sm uppercase tracking-[.3em] text-purple-700">Convite</p>
                        <h1 className="text-3xl font-semibold text-slate-900">Convite indisponível</h1>
                        <p className="text-slate-600">
                            {invitationDetailsQuery.error instanceof Error
                                ? invitationDetailsQuery.error.message
                                : 'Não foi possível carregar o convite'}
                        </p>
                    </div>
                ) : invitation ? (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <p className="text-sm uppercase tracking-[.3em] text-purple-700">Convite para equipe</p>
                            <h1 className="text-3xl font-semibold text-slate-900">Aceitar convite</h1>
                            <p className="text-slate-600">
                                Você foi convidado para entrar no negócio <span className="font-semibold">{invitation.business.name}</span>.
                            </p>
                        </div>

                        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
                            <div>
                                <p className="text-xs uppercase tracking-[.2em] text-slate-500">Negócio</p>
                                <p className="mt-1 font-medium text-slate-900">{invitation.business.name}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[.2em] text-slate-500">Email</p>
                                <p className="mt-1 break-all font-medium text-slate-900">{invitation.email}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[.2em] text-slate-500">Permissão</p>
                                <p className="mt-1 font-medium text-slate-900">{roleLabel(invitation.role)}</p>
                            </div>
                        </div>

                        <form onSubmit={onSubmit} className="grid gap-4">
                            {!invitation.userExists ? (
                                <>
                                    <Label className="space-y-2">
                                        <span>Nome completo</span>
                                        <Input type="text" {...register('name')} placeholder="Seu nome completo" />
                                        {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
                                    </Label>

                                    <Label className="space-y-2">
                                        <span>Crie sua senha</span>
                                        <Input type="password" {...register('password')} placeholder="••••••••" />
                                        {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
                                    </Label>
                                </>
                            ) : (
                                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                                    Já existe uma conta com este email. Ao continuar, ela será vinculada a este negócio.
                                </div>
                            )}

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="submit"
                                    disabled={acceptInvitationMutation.isPending}
                                    className="min-h-12 sm:w-auto"
                                >
                                    {acceptInvitationMutation.isPending ? 'Aceitando...' : 'Aceitar convite'}
                                </Button>
                            </div>
                        </form>
                    </div>
                ) : null}
            </Card>
        </main>
    )
}
