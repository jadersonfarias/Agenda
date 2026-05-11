export type InvitationDetails = {
    id: string
    email: string
    role: 'OWNER' | 'ADMIN' | 'STAFF'
    expiresAt: string
    acceptedAt: string | null
    createdAt: string
    isExpired: boolean
    userExists: boolean
    business: {
        id: string
        name: string
        slug: string
    }
}

export type AcceptInvitationResponse = {
    success: boolean
    userCreated: boolean
    business: {
        id: string
        name: string
        slug: string
    }
}
