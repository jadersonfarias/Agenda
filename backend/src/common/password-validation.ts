import { z } from 'zod'

export const strongPasswordErrorMessage =
  'A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e símbolo.'

export function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9\s]/.test(value)
  )
}

export const strongPasswordSchema = z
  .string()
  .refine(isStrongPassword, strongPasswordErrorMessage)
