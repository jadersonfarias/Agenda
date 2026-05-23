import { type AdminBusinessOption } from './types'

export type AdminRole = AdminBusinessOption['role']
export type AdminSectionPermission = 'overview' | 'appointments' | 'services' | 'team' | 'financial' | 'settings'

export type AdminUiPermissions = {
    role: AdminRole | null
    canViewOverview: boolean
    canViewAppointments: boolean
    canViewServices: boolean
    canViewTeam: boolean
    canViewFinancial: boolean
    canViewSettings: boolean
    canManageServices: boolean
    canManageTeam: boolean
    canCreateInvitation: boolean
    canCreateMembership: boolean
    canManageMemberships: boolean
    canManageAppointmentAssignee: boolean
    canViewSubscriptionPayment: boolean
}

const fallbackPermissions: AdminUiPermissions = {
    role: null,
    canViewOverview: false,
    canViewAppointments: true,
    canViewServices: false,
    canViewTeam: false,
    canViewFinancial: false,
    canViewSettings: false,
    canManageServices: false,
    canManageTeam: false,
    canCreateInvitation: false,
    canCreateMembership: false,
    canManageMemberships: false,
    canManageAppointmentAssignee: false,
    canViewSubscriptionPayment: false,
}

export function resolveAdminUiPermissions(role: AdminRole | null | undefined): AdminUiPermissions {
    if (role === 'OWNER') {
        return {
            role,
            canViewOverview: true,
            canViewAppointments: true,
            canViewServices: true,
            canViewTeam: true,
            canViewFinancial: true,
            canViewSettings: true,
            canManageServices: true,
            canManageTeam: true,
            canCreateInvitation: true,
            canCreateMembership: true,
            canManageMemberships: true,
            canManageAppointmentAssignee: true,
            canViewSubscriptionPayment: true,
        }
    }

    if (role === 'ADMIN') {
        return {
            role,
            canViewOverview: false,
            canViewAppointments: true,
            canViewServices: true,
            canViewTeam: false,
            canViewFinancial: true,
            canViewSettings: true,
            canManageServices: true,
            canManageTeam: false,
            canCreateInvitation: false,
            canCreateMembership: false,
            canManageMemberships: false,
            canManageAppointmentAssignee: true,
            canViewSubscriptionPayment: true,
        }
    }

    if (role === 'STAFF') {
        return {
            ...fallbackPermissions,
            role,
        }
    }

    return fallbackPermissions
}

export function canViewAdminSection(
    permissions: AdminUiPermissions,
    section: AdminSectionPermission
): boolean {
    if (section === 'overview') return permissions.canViewOverview
    if (section === 'appointments') return permissions.canViewAppointments
    if (section === 'services') return permissions.canViewServices
    if (section === 'team') return permissions.canViewTeam
    if (section === 'financial') return permissions.canViewFinancial

    return permissions.canViewSettings
}
