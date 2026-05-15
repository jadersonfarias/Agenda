import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

export type LoginDto = z.infer<typeof loginSchema>

export const registerBusinessOwnerSchema = z.object({
  ownerName: z.string().trim().min(2, 'Informe o nome do dono'),
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  businessName: z.string().trim().min(2, 'Informe o nome do negócio'),
  businessSlug: z
    .string()
    .trim()
    .min(3, 'Informe o slug do negócio')
    .max(50, 'Slug muito longo')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido'),
  phone: z
    .string()
    .trim()
    .min(8, 'Telefone inválido')
    .max(20, 'Telefone inválido')
    .regex(/^[0-9+()\-\s]+$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
})

export type RegisterBusinessOwnerDto = z.infer<typeof registerBusinessOwnerSchema>

export type AuthUserResponse = {
  id: string
  name: string | null
  email: string
}

export type AuthBusinessContext = {
  id: string
  name: string
  slug: string
  role: 'OWNER' | 'ADMIN' | 'STAFF'
}

export type LoginResponse = {
  user: AuthUserResponse
  businesses: AuthBusinessContext[]
  currentBusinessId: string | null
  accessToken: string
}

export type RegisterBusinessOwnerResponse = {
  user: AuthUserResponse
  business: {
    id: string
    name: string
    slug: string
    phone: string | null
    plan: 'FREE' | 'BASIC' | 'PRO'
    subscriptionStatus: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
    trialEndsAt: string | null
  }
  membership: {
    id: string
    role: 'OWNER'
  }
}
