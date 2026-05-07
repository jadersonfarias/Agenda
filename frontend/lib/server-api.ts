import axios from 'axios'

const apiBaseUrl =
    process.env.API_URL ??
    'http://127.0.0.1:3333'

export function createServerApi(accessToken?: string) {
    return axios.create({
        baseURL: apiBaseUrl,
        headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
            }
            : undefined,
    })
}

export function getServerApiErrorMessage(error: unknown, fallbackMessage: string) {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data

        if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
            return data.message
        }
    }

    return error instanceof Error ? error.message : fallbackMessage
}
