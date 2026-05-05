export const MEMBERSHIP_ROLES = ['OWNER', 'ADMIN', 'STAFF'] as const

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number]
