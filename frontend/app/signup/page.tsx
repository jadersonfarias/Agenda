'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api, getApiErrorMessage } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

const signupSchema = z.object({
    ownerName: z.string().trim().min(2, 'Informe o nome do dono'),
    email: z.string().trim().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    businessName: z.string().trim().min(2, 'Informe o nome do negócio'),
    businessSlug: z
        .string()
        .trim()
        .min(3, 'Informe o slug do negócio')
        .max(50, 'Slug muito longo')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífens'),
    phone: z
        .string()
        .trim()
        .max(20, 'Telefone inválido')
        .regex(/^[0-9+()\-\s]*$/, 'Telefone inválido')
        .optional(),
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
    const router = useRouter()
    const [error, setError] = useState('')
    const { register, handleSubmit, formState } = useForm<SignupForm>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            ownerName: '',
            email: '',
            password: '',
            businessName: '',
            businessSlug: '',
            phone: '',
        },
    })

    const onSubmit = handleSubmit(async (data) => {
        setError('')

        try {
            await api.post('/auth/register-business-owner', {
                ownerName: data.ownerName,
                email: data.email,
                password: data.password,
                businessName: data.businessName,
                businessSlug: data.businessSlug,
                phone: data.phone?.trim() || '',
            })

            toast.success('Cadastro criado com sucesso')
            router.push('/login')
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, 'Não foi possível criar sua conta'))
        }
    })

    return (
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
            <Card>
                <div className="space-y-5">
                    <div>
                        <p className="text-sm uppercase tracking-[.3em] text-purple-700">Cadastro público</p>
                        <h1 className="text-3xl font-semibold text-slate-900">Crie seu negócio</h1>
                        <p className="text-slate-600">
                            Cadastre o dono e o primeiro negócio para começar a usar o painel administrativo.
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="grid gap-4">
                        <Label className="space-y-2">
                            <span>Nome do dono</span>
                            <Input type="text" {...register('ownerName')} placeholder="Maria Oliveira" />
                            {formState.errors.ownerName ? <p className="text-sm text-red-600">{formState.errors.ownerName.message}</p> : null}
                        </Label>

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

                        <Label className="space-y-2">
                            <span>Nome do negócio</span>
                            <Input type="text" {...register('businessName')} placeholder="Salão da Maria" />
                            {formState.errors.businessName ? <p className="text-sm text-red-600">{formState.errors.businessName.message}</p> : null}
                        </Label>

                        <Label className="space-y-2">
                            <span>Slug do negócio</span>
                            <Input type="text" {...register('businessSlug')} placeholder="salao-da-maria" />
                            <p className="text-xs text-slate-500">Use letras minúsculas, números e hífens.</p>
                            {formState.errors.businessSlug ? <p className="text-sm text-red-600">{formState.errors.businessSlug.message}</p> : null}
                        </Label>

                        <Label className="space-y-2">
                            <span>Telefone do negócio opcional</span>
                            <Input type="text" {...register('phone')} placeholder="(11) 91234-5678" />
                            {formState.errors.phone ? <p className="text-sm text-red-600">{formState.errors.phone.message}</p> : null}
                        </Label>

                        {error ? <p className="text-sm text-red-600">{error}</p> : null}

                        <Button type="submit" disabled={formState.isSubmitting}>
                            {formState.isSubmitting ? 'Criando...' : 'Criar cadastro'}
                        </Button>
                    </form>

                    <p className="text-sm text-slate-600">
                        Já tem conta?{' '}
                        <Link href="/login" className="font-semibold text-purple-700 hover:text-purple-800">
                            Fazer login
                        </Link>
                    </p>
                </div>
            </Card>
        </main>
    )
}
