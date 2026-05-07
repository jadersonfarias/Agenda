import { z } from 'zod'

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/

export const adminBusinessIdSchema = z.object({
  businessId: z.string().trim().min(1, 'businessId é obrigatório'),
})

export const adminAppointmentsQuerySchema = adminBusinessIdSchema.extend({
  statusFilter: z.enum(['active', 'completed', 'all']).optional(),
})

export const adminMonthlySummaryQuerySchema = adminBusinessIdSchema.extend({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'month deve estar no formato YYYY-MM')
    .optional(),
})

export const adminServiceSchema = adminBusinessIdSchema.extend({
  name: z.string().trim().min(2, 'Informe o nome do serviço'),
  price: z.coerce.number().positive('Informe um preço maior que zero'),
  durationMinutes: z.coerce
    .number()
    .int('A duração deve ser um número inteiro')
    .min(5, 'A duração mínima é de 5 minutos')
    .max(480, 'A duração máxima é de 480 minutos'),
})

export const adminBusinessAvailabilitySchema = adminBusinessIdSchema
  .extend({
    openTime: z.string().regex(timePattern, 'Horário de abertura inválido'),
    closeTime: z.string().regex(timePattern, 'Horário de encerramento inválido'),
  })
  .refine(({ openTime, closeTime }) => openTime < closeTime, {
    message: 'O encerramento deve ser depois da abertura',
    path: ['closeTime'],
  })

export const adminMembershipRoleSchema = adminBusinessIdSchema.extend({
  role: z.enum(['OWNER', 'ADMIN', 'STAFF']),
})

export const adminCreateMembershipSchema = adminBusinessIdSchema.extend({
  email: z.string().trim().email('Informe um email válido'),
  role: z.enum(['OWNER', 'ADMIN', 'STAFF']),
})

export const adminCreateInvitationSchema = adminBusinessIdSchema.extend({
  email: z.string().trim().email('Informe um email válido'),
  role: z.enum(['OWNER', 'ADMIN', 'STAFF']),
})

export const acceptInvitationSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome completo').optional(),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').optional(),
})

export type AdminServiceDto = z.infer<typeof adminServiceSchema>
export type AdminBusinessAvailabilityDto = z.infer<typeof adminBusinessAvailabilitySchema>
export type AdminAppointmentsQueryDto = z.infer<typeof adminAppointmentsQuerySchema>
export type AdminMembershipRoleDto = z.infer<typeof adminMembershipRoleSchema>
export type AdminCreateMembershipDto = z.infer<typeof adminCreateMembershipSchema>
export type AdminCreateInvitationDto = z.infer<typeof adminCreateInvitationSchema>
export type AcceptInvitationDto = z.infer<typeof acceptInvitationSchema>
