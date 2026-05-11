import { z } from 'zod'

export const createAppointmentSchema = z.object({
  businessId: z.string().min(1, 'businessId é obrigatório'),
  serviceId: z.string().uuid('serviceId inválido'),
  customerName: z.string().trim().min(2, 'O nome do cliente deve ter pelo menos 2 caracteres').max(120, 'Nome muito longo'),
  phone: z.string().trim().min(8, 'Telefone inválido').max(20, 'Telefone inválido').regex(/^[0-9+()\-\s]+$/, 'Telefone inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Horário inválido'),
})

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELED']),
})

export const customerAppointmentsLookupSchema = z.object({
  phone: z.string().trim().min(8, 'Telefone inválido').max(20, 'Telefone inválido').regex(/^[0-9+()\-\s]+$/, 'Telefone inválido'),
})

export const publicAppointmentTokenSchema = z.object({
  token: z.string().trim().min(1, 'Token inválido'),
})

export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentStatusDto = z.infer<typeof updateAppointmentStatusSchema>
export type CustomerAppointmentsLookupDto = z.infer<typeof customerAppointmentsLookupSchema>
export type PublicAppointmentTokenDto = z.infer<typeof publicAppointmentTokenSchema>
