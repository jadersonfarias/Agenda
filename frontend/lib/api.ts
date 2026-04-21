import axios from 'axios'
import { getSession } from 'next-auth/react'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

export const api = axios.create({
    baseURL: apiBaseUrl,
})

api.interceptors.request.use(async (config) => {
    const session = await getSession()
    const accessToken = session?.accessToken

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
})
