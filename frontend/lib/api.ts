import axios from 'axios'
import { getSession } from 'next-auth/react'

export const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    '/backend'

const serverApiBaseUrl =
    process.env.API_URL ??
    'http://127.0.0.1:3333'

export const api = axios.create({
    baseURL: apiBaseUrl,
})

api.interceptors.request.use(async (config) => {
    if (typeof window === 'undefined') {
        return config
    }

    const session = await getSession()
    const accessToken = session?.accessToken

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
})

export function createServerApi(accessToken?: string) {
    return axios.create({
        baseURL: serverApiBaseUrl,
        headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
            }
            : undefined,
    })
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data

        if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
            return data.message
        }
    }

    return error instanceof Error ? error.message : fallbackMessage
}
