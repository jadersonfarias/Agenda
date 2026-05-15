'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
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
    confirmPassword: z.string().optional(),
}).superRefine((value, context) => {
    const hasName = Boolean(value.name?.trim())
    const hasPassword = Boolean(value.password)
    const hasConfirmPassword = Boolean(value.confirmPassword)

    if ((hasName || hasPassword || hasConfirmPassword) && !hasName) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['name'],
            message: 'Informe seu nome completo',
        })
    }

    if ((hasName || hasPassword || hasConfirmPassword) && !hasPassword) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['password'],
            message: 'Informe uma senha',
        })
    }

    if ((hasName || hasPassword || hasConfirmPassword) && !hasConfirmPassword) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['confirmPassword'],
            message: 'Confirme sua senha',
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

    if (value.password && value.confirmPassword && value.password !== value.confirmPassword) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['confirmPassword'],
            message: 'As senhas não conferem',
        })
    }
})

type AcceptInvitationForm = z.infer<typeof acceptInvitationSchema>

function roleLabel(role: 'OWNER' | 'ADMIN' | 'STAFF') {
    if (role === 'OWNER') return 'Dono'
    if (role === 'ADMIN') return 'Administrador'
    return 'Funcionário'
}

function getInvitationErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : ''

    if (/expir/i.test(message)) {
        return 'Este convite expirou. Peça para a equipe enviar um novo link.'
    }

    if (/aceito/i.test(message)) {
        return 'Este convite já foi aceito. Você já pode tentar entrar com sua conta.'
    }

    if (/não encontrado|inval/i.test(message)) {
        return 'Este convite é inválido. Confira se o link está completo ou peça um novo convite.'
    }

    return message || 'Não foi possível carregar o convite.'
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
        setError,
        formState: { errors },
    } = useForm<AcceptInvitationForm>({
        resolver: zodResolver(acceptInvitationSchema),
        defaultValues: {
            name: '',
            password: '',
            confirmPassword: '',
        },
    })
    const invitation = invitationDetailsQuery.data

    const onSubmit = handleSubmit(async (values) => {
        if (!token) {
            toast.error('Convite inválido')
            return
        }

        if (invitation && !invitation.userExists) {
            if (!values.name?.trim()) {
                setError('name', { message: 'Informe seu nome completo' })
                return
            }

            if (!values.password) {
                setError('password', { message: 'Informe uma senha' })
                return
            }

            if (!values.confirmPassword) {
                setError('confirmPassword', { message: 'Confirme sua senha' })
                return
            }

            if (values.password !== values.confirmPassword) {
                setError('confirmPassword', { message: 'As senhas não conferem' })
                return
            }
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
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-start overflow-x-hidden px-3 py-4 sm:items-center sm:px-6 sm:py-10 lg:px-8 lg:py-16">
            <Card className="w-full rounded-2xl p-4 sm:rounded-3xl sm:p-6 lg:p-8">
                {invitationDetailsQuery.isLoading ? (
                    <div className="space-y-2 sm:space-y-4">
                        <p className="text-xs uppercase tracking-[.18em] text-purple-700 sm:text-sm sm:tracking-[.3em]">Convite</p>
                        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Carregando convite...</h1>
                        <p className="text-sm text-slate-600 sm:text-base">Estamos validando o link e buscando os dados do negócio.</p>
                    </div>
                ) : invitationDetailsQuery.isError ? (
                    <div className="space-y-2 sm:space-y-4">
                        <p className="text-xs uppercase tracking-[.18em] text-purple-700 sm:text-sm sm:tracking-[.3em]">Convite</p>
                        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Convite indisponível</h1>
                        <p className="text-sm text-slate-600 sm:text-base">
                            {getInvitationErrorMessage(invitationDetailsQuery.error)}
                        </p>
                        <Link href="/login" className="inline-flex text-sm font-semibold text-purple-700 hover:text-purple-800">
                            Já tenho conta. Entrar
                        </Link>
                    </div>
                ) : invitation ? (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="space-y-2 sm:space-y-3">
                            <p className="text-xs uppercase tracking-[.18em] text-purple-700 sm:text-sm sm:tracking-[.3em]">Convite para equipe</p>
                            <h1 className="text-[1.6rem] font-semibold text-slate-900 sm:text-3xl">Aceitar convite</h1>
                            <p className="text-sm text-slate-600 sm:text-base">
                                Você foi convidado para entrar no negócio <span className="font-semibold">{invitation.business.name}</span>.
                            </p>
                        </div>

                        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-3 md:gap-4 md:rounded-3xl md:p-4">
                            <div>
                                <p className="text-[11px] uppercase tracking-[.14em] text-slate-500 sm:text-xs sm:tracking-[.2em]">Negócio</p>
                                <p className="mt-0.5 text-sm font-medium text-slate-900 sm:mt-1 sm:text-base">{invitation.business.name}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-[.14em] text-slate-500 sm:text-xs sm:tracking-[.2em]">Email</p>
                                <p className="mt-0.5 break-all text-sm font-medium text-slate-900 sm:mt-1 sm:text-base">{invitation.email}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-[.14em] text-slate-500 sm:text-xs sm:tracking-[.2em]">Permissão</p>
                                <p className="mt-0.5 text-sm font-medium text-slate-900 sm:mt-1 sm:text-base">{roleLabel(invitation.role)}</p>
                            </div>
                        </div>

                        <form onSubmit={onSubmit} className="grid gap-3 sm:gap-4">
                            {!invitation.userExists ? (
                                <>
                                    <Label className="space-y-1.5 sm:space-y-2">
                                        <span>Nome completo</span>
                                        <Input type="text" {...register('name')} placeholder="Seu nome completo" />
                                        {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
                                    </Label>

                                    <Label className="space-y-1.5 sm:space-y-2">
                                        <span>Crie sua senha</span>
                                        <Input type="password" {...register('password')} placeholder="••••••••" />
                                        <p className="text-xs text-slate-500">Use pelo menos 6 caracteres.</p>
                                        {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
                                    </Label>

                                    <Label className="space-y-1.5 sm:space-y-2">
                                        <span>Confirmar senha</span>
                                        <Input type="password" {...register('confirmPassword')} placeholder="••••••••" />
                                        {errors.confirmPassword ? (
                                            <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                                        ) : null}
                                    </Label>
                                </>
                            ) : (
                                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-800 sm:px-4 sm:py-3">
                                    Já existe uma conta com este email. Ao continuar, ela será vinculada a este negócio.
                                </div>
                            )}

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Link
                                    href="/login"
                                    className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-200 sm:px-6 sm:text-sm md:w-auto"
                                >
                                    Já tenho conta. Entrar
                                </Link>
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
