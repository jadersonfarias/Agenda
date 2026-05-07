import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

export type LoginDto = z.infer<typeof loginSchema>

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
