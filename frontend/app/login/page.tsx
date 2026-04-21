'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const [error, setError] = useState('')
    const { register, handleSubmit, formState } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    })

    const onSubmit = async (data: LoginForm) => {
        setError('')
        const result = await signIn('credentials', { ...data, redirect: false })
        if (!result?.ok) {
            setError(result?.error || 'Não foi possível fazer login')
            return
        }
        router.push('/admin')
    }

    return (
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
            <Card>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm uppercase tracking-[.3em] text-purple-700">Área administrativa</p>
                        <h1 className="text-3xl font-semibold text-slate-900">Faça login</h1>
                        <p className="text-slate-600">Use sua conta para acessar os dados do negócio e gerenciar agendamentos.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                        <Label className="space-y-2">
                            <span>Email</span>
                            <Input type="email" {...register('email')} placeholder="owner@example.com" />
                            {formState.errors.email ? <p className="text-sm text-red-600">{formState.errors.email.message}</p> : null}
                        </Label>

                        <Label className="space-y-2">
                            <span>Senha</span>
                            <Input type="password" {...register('password')} placeholder="••••••••" />
                            {formState.errors.password ? <p className="text-sm text-red-600">{formState.errors.password.message}</p> : null}
                        </Label>

                        {error ? <p className="text-sm text-red-600">{error}</p> : null}

                        <Button type="submit">Entrar</Button>
                    </form>
                </div>
            </Card>
        </main>
    )
}
