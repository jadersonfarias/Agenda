import { z } from 'zod'

export const strongPasswordErrorMessage =
    'A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e símbolo.'

export const passwordRequirementItems = [
    { key: 'minLength', label: 'Mínimo 8 caracteres' },
    { key: 'hasUppercase', label: 'Uma letra maiúscula' },
    { key: 'hasLowercase', label: 'Uma letra minúscula' },
    { key: 'hasNumber', label: 'Um número' },
    { key: 'hasSymbol', label: 'Um símbolo' },
] as const

export type PasswordRequirementKey = (typeof passwordRequirementItems)[number]['key']

export type PasswordRequirements = Record<PasswordRequirementKey, boolean>

export function getPasswordRequirements(value: string): PasswordRequirements {
    return {
        minLength: value.length >= 8,
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /\d/.test(value),
        hasSymbol: /[^A-Za-z0-9\s]/.test(value),
    }
}

export function isStrongPassword(value: string) {
    const requirements = getPasswordRequirements(value)

    return Object.values(requirements).every(Boolean)
}

export const strongPasswordSchema = z
    .string()
    .refine(isStrongPassword, strongPasswordErrorMessage)
