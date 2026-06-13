import { z } from 'zod'

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/

export const serviceFormSchema = z.object({
    name: z.string().trim().min(2, 'Informe o nome do serviço'),
    description: z
        .string()
        .trim()
        .max(300, 'A descrição deve ter no máximo 300 caracteres')
        .optional(),
    price: z.coerce.number().positive('Informe um preço maior que zero'),
    durationMinutes: z.coerce
        .number()
        .int('A duração deve ser um número inteiro')
        .min(5, 'A duração mínima é de 5 minutos')
        .max(480, 'A duração máxima é de 480 minutos'),
})

export const availabilityFormSchema = z
    .object({
        openTime: z.string().regex(timePattern, 'Informe um horário válido no formato HH:mm.'),
        closeTime: z.string().regex(timePattern, 'Informe um horário válido no formato HH:mm.'),
    })
    .refine(({ openTime, closeTime }) => openTime < closeTime, {
        message: 'O horário de abertura precisa ser menor que o horário de encerramento.',
        path: ['closeTime'],
    })

export const serviceRouteSchema = serviceFormSchema.extend({
    serviceId: z.string().uuid('Serviço inválido').optional(),
})

export type ServiceFormValues = z.infer<typeof serviceFormSchema>
export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>
