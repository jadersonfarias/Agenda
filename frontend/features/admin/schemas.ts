import { z } from 'zod'

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/

export const serviceFormSchema = z.object({
    name: z.string().trim().min(2, 'Informe o nome do serviço'),
    price: z.coerce.number().positive('Informe um preço maior que zero'),
    durationMinutes: z.coerce
        .number()
        .int('A duração deve ser um número inteiro')
        .min(5, 'A duração mínima é de 5 minutos')
        .max(480, 'A duração máxima é de 480 minutos'),
})

export const availabilityFormSchema = z
    .object({
        openTime: z.string().regex(timePattern, 'Horário de abertura inválido'),
        closeTime: z.string().regex(timePattern, 'Horário de encerramento inválido'),
    })
    .refine(({ openTime, closeTime }) => openTime < closeTime, {
        message: 'O encerramento deve ser depois da abertura',
        path: ['closeTime'],
    })

export const serviceRouteSchema = serviceFormSchema.extend({
    serviceId: z.string().uuid('Serviço inválido').optional(),
})

export type ServiceFormValues = z.infer<typeof serviceFormSchema>
export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>
