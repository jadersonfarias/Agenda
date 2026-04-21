import { z } from 'zod'

export const businessLookupSchema = z.string().min(1, 'businessId é obrigatório')

export const getAvailabilityQuerySchema = z.object({
  serviceId: z.string().uuid('serviceId inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
})

export type GetAvailabilityQueryDto = z.infer<typeof getAvailabilityQuerySchema>
