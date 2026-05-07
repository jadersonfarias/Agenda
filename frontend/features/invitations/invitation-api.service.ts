import { api, getApiErrorMessage } from '../../lib/api'
import { type AcceptInvitationResponse, type InvitationDetails } from './types'

export async function fetchInvitation(token: string) {
    try {
        const response = await api.get<InvitationDetails>(`/invitations/${token}`)

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível carregar o convite'))
    }
}

export async function acceptInvitation(input: {
    token: string
    name?: string
    password?: string
}) {
    try {
        const response = await api.post<AcceptInvitationResponse>(`/invitations/${input.token}/accept`, {
            name: input.name,
            password: input.password,
        })

        return response.data
    } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Não foi possível aceitar o convite'))
    }
}
