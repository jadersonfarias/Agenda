import { z } from 'zod'

export const platformBusinessesQuerySchema = z.object({
  status: z.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED']).optional(),
  plan: z.enum(['FREE', 'BASIC', 'PRO']).optional(),
  search: z.string().trim().min(1, 'search não pode ser vazio').optional(),
})

export const platformUpdateBusinessSubscriptionSchema = z.object({
  plan: z.enum(['BASIC', 'PRO']),
  months: z.coerce.number().int('months deve ser um número inteiro').min(1, 'months deve ser no mínimo 1'),
  paymentMethod: z.enum(['PIX', 'MANUAL']),
})

export type PlatformBusinessesQueryDto = z.infer<typeof platformBusinessesQuerySchema>
export type PlatformUpdateBusinessSubscriptionDto = z.infer<typeof platformUpdateBusinessSubscriptionSchema>
