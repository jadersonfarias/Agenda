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

const sessionExpiredLoginPath = '/login?reason=session-expired'

let isRedirectingToSessionExpiredLogin = false

export class ApiSessionExpiredError extends Error {
    constructor() {
        super('Sua sessão expirou. Faça login novamente.')
        this.name = 'ApiSessionExpiredError'
    }
}

function getApiErrorPayloadMessage(error: unknown) {
    if (!axios.isAxiosError(error)) {
        return undefined
    }

    const data = error.response?.data

    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
        return data.message
    }

    return undefined
}

function isAuthenticatedPanelRequest(url?: string) {
    return (
        typeof url === 'string' &&
        (url === '/admin' ||
            url.startsWith('/admin/') ||
            url === '/platform' ||
            url.startsWith('/platform/'))
    )
}

export function isApiSessionExpiredError(error: unknown) {
    if (error instanceof ApiSessionExpiredError) {
        return true
    }

    if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
            return true
        }

        return getApiErrorPayloadMessage(error)?.includes('Token inválido ou expirado') === true
    }

    return error instanceof Error && error.message.includes('Token inválido ou expirado')
}

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

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            typeof window !== 'undefined' &&
            isAuthenticatedPanelRequest(error.config?.url) &&
            isApiSessionExpiredError(error) &&
            !isRedirectingToSessionExpiredLogin
        ) {
            isRedirectingToSessionExpiredLogin = true
            window.location.assign(sessionExpiredLoginPath)
        }

        return Promise.reject(error)
    }
)

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
        const message = getApiErrorPayloadMessage(error)

        if (message) {
            return message
        }
    }

    return error instanceof Error ? error.message : fallbackMessage
}
