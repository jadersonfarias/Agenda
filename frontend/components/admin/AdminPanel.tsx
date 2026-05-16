'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
    getAdminAppointmentsQueryBusinessKey,
    getAdminAppointmentsQueryKey,
    useAdminAppointmentsQuery,
} from '../../features/admin/hooks/use-admin-appointments-query'
import { useAdminInvitationsQuery } from '../../features/admin/hooks/use-admin-invitations-query'
import { useAdminMembershipsQuery } from '../../features/admin/hooks/use-admin-memberships-query'
import { useAdminServicesQuery } from '../../features/admin/hooks/use-admin-services-query'
import {
    type AdminAppointmentItem,
    type AdminAppointmentStatusFilter,
    type AdminBusinessOption,
    type AdminDashboardData,
} from '../../features/admin/types'
import { decodeAccessToken } from '../../lib/access-token'
import { fetchAdminDashboard } from '../../features/admin/services/admin-api.service'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { AdminHeader } from './AdminHeader'
import { AppointmentsSection } from './AppointmentsSection'
import { AvailabilitySection } from './AvailabilitySection'
import { AdminNavigation, type AdminSectionId } from './AdminNavigation'
import { FinancialSummarySection } from './FinancialSummarySection'
import { OnboardingChecklist } from './OnboardingChecklist'
import { PublicBookingLinkCard } from './PublicBookingLinkCard'
import { ServicesSection } from './ServicesSection'
import { TeamSection } from './TeamSection'

type AdminPanelProps = {
    initialData: AdminDashboardData
    initialAppointments: AdminAppointmentItem[]
    businesses: AdminBusinessOption[]
    currentBusinessId: string
}

const ADMIN_BUSINESS_STORAGE_KEY = 'admin.currentBusinessId'

type AppointmentsSummary = {
    total: number
    scheduled: number
    completed: number
    canceled: number
}

function resolveAppointmentsSummary(
    data: Pick<AdminDashboardData, 'appointmentsSummary' | 'appointmentsCount' | 'services'>
): AppointmentsSummary {
    if (data.appointmentsSummary) {
        return data.appointmentsSummary
    }

    const total = typeof data.appointmentsCount === 'number' && Number.isFinite(data.appointmentsCount)
        ? data.appointmentsCount
        : data.services.reduce((sum, service) => sum + service.appointmentCount, 0)

    return {
        total,
        scheduled: total,
        completed: 0,
        canceled: 0,
    }
}

export default function AdminPanel({
    initialData,
    initialAppointments,
    businesses,
    currentBusinessId,
}: AdminPanelProps) {
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const hasResolvedStoredBusiness = useRef(false)
    const [selectedBusinessId, setSelectedBusinessId] = useState(currentBusinessId)
    const [business, setBusiness] = useState(initialData.business)
    const [servicesSnapshot, setServicesSnapshot] = useState(initialData.services)
    const [appointmentsSummary, setAppointmentsSummary] = useState<AppointmentsSummary>(
        resolveAppointmentsSummary(initialData)
    )
    const [activeSection, setActiveSection] = useState<AdminSectionId>('overview')
    const [appointmentFilter, setAppointmentFilter] = useState<AdminAppointmentStatusFilter>('scheduled')
    const [isSwitchingBusiness, setIsSwitchingBusiness] = useState(false)
    const isAuthenticated = Boolean(session?.accessToken)
    const servicesQuery = useAdminServicesQuery(selectedBusinessId, isAuthenticated)
    const appointmentsQuery = useAdminAppointmentsQuery(
        selectedBusinessId,
        appointmentFilter,
        isAuthenticated,
        selectedBusinessId === currentBusinessId && appointmentFilter === 'scheduled'
            ? initialAppointments
            : undefined
    )

    const updateAdminUrl = (businessId: string) => {
        if (typeof window === 'undefined') {
            return
        }

        const nextUrl = new URL(window.location.href)
        nextUrl.pathname = '/admin'
        nextUrl.searchParams.set('businessId', businessId)
        window.history.replaceState(null, '', nextUrl.toString())
    }

    useEffect(() => {
        setSelectedBusinessId(currentBusinessId)
        setBusiness(initialData.business)
        setServicesSnapshot(initialData.services)
        setAppointmentsSummary(resolveAppointmentsSummary(initialData))
        setIsSwitchingBusiness(false)
    }, [currentBusinessId, initialData])

    useEffect(() => {
        queryClient.setQueryData(
            getAdminAppointmentsQueryKey(currentBusinessId, 'scheduled'),
            initialAppointments
        )
    }, [currentBusinessId, initialAppointments, queryClient])

    useEffect(() => {
        if (typeof window === 'undefined' || hasResolvedStoredBusiness.current) {
            return
        }

        hasResolvedStoredBusiness.current = true

        const storedBusinessId = window.localStorage.getItem(ADMIN_BUSINESS_STORAGE_KEY)
        const hasStoredBusinessAccess = storedBusinessId
            ? businesses.some((item) => item.id === storedBusinessId)
            : false

        if (storedBusinessId && hasStoredBusinessAccess && storedBusinessId !== currentBusinessId) {
            setSelectedBusinessId(storedBusinessId)
            updateAdminUrl(storedBusinessId)
            return
        }

        window.localStorage.setItem(ADMIN_BUSINESS_STORAGE_KEY, currentBusinessId)
    }, [businesses, currentBusinessId])

    const canCreateMembership = (() => {
        if (!session?.accessToken) {
            return false
        }

        try {
            const membership = decodeAccessToken(session.accessToken).memberships?.find(
                (item) => item.businessId === selectedBusinessId
            )

            return membership?.role === 'OWNER'
        } catch {
            return false
        }
    })()

    const canManageMemberships = (() => {
        if (!session?.accessToken) {
            return false
        }

        try {
            const membership = decodeAccessToken(session.accessToken).memberships?.find(
                (item) => item.businessId === selectedBusinessId
            )

            return membership?.role === 'OWNER' || membership?.role === 'ADMIN'
        } catch {
            return false
        }
    })()

    const onboardingMembershipsQuery = useAdminMembershipsQuery(
        selectedBusinessId,
        isAuthenticated && activeSection === 'overview' && canCreateMembership
    )
    const onboardingInvitationsQuery = useAdminInvitationsQuery(
        selectedBusinessId,
        isAuthenticated && activeSection === 'overview' && canCreateMembership
    )

    const handleBusinessChange = async (nextBusinessId: string) => {
        if (!nextBusinessId || nextBusinessId === selectedBusinessId) {
            return
        }

        setSelectedBusinessId(nextBusinessId)
        setIsSwitchingBusiness(true)

        if (typeof window !== 'undefined') {
            window.localStorage.setItem(ADMIN_BUSINESS_STORAGE_KEY, nextBusinessId)
        }

        updateAdminUrl(nextBusinessId)

        if (!session?.accessToken) {
            return
        }

        try {
            const nextDashboard = await fetchAdminDashboard(nextBusinessId)

            setBusiness(nextDashboard.business)
            setServicesSnapshot(nextDashboard.services)
            setAppointmentsSummary(resolveAppointmentsSummary(nextDashboard))
            queryClient.setQueryData(['admin-services', nextBusinessId], nextDashboard.services)
            queryClient.removeQueries({ queryKey: getAdminAppointmentsQueryBusinessKey(nextBusinessId) })

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['admin-services', nextBusinessId] }),
                queryClient.invalidateQueries({ queryKey: ['admin-memberships', nextBusinessId] }),
                queryClient.invalidateQueries({ queryKey: ['admin-invitations', nextBusinessId] }),
                queryClient.invalidateQueries({ queryKey: getAdminAppointmentsQueryBusinessKey(nextBusinessId) }),
                queryClient.invalidateQueries({ queryKey: ['admin-monthly-summary', nextBusinessId] }),
            ])
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível trocar o negócio atual'

            toast.error(message)
            setSelectedBusinessId(currentBusinessId)
            setBusiness(initialData.business)
            setServicesSnapshot(initialData.services)
            setAppointmentsSummary(resolveAppointmentsSummary(initialData))
            setIsSwitchingBusiness(false)

            if (typeof window !== 'undefined') {
                window.localStorage.setItem(ADMIN_BUSINESS_STORAGE_KEY, currentBusinessId)
            }

            updateAdminUrl(currentBusinessId)
        }
    }

    const handleAppointmentStatusSaved = ({
        previousStatus,
        nextStatus,
    }: {
        previousStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELED'
        nextStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELED'
    }) => {
        if (previousStatus === nextStatus) {
            return
        }

        setAppointmentsSummary((current) => {
            const nextSummary = {
                ...current,
                scheduled: current.scheduled,
                completed: current.completed,
                canceled: current.canceled,
            }

            const decrementMap = {
                SCHEDULED: 'scheduled',
                COMPLETED: 'completed',
                CANCELED: 'canceled',
            } as const

            nextSummary[decrementMap[previousStatus]] = Math.max(
                0,
                nextSummary[decrementMap[previousStatus]] - 1
            )
            nextSummary[decrementMap[nextStatus]] += 1

            return nextSummary
        })
    }

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 overflow-x-hidden px-3 py-4 sm:gap-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <AdminHeader
                business={business}
                businesses={businesses}
                currentBusinessId={selectedBusinessId}
                isSwitchingBusiness={isSwitchingBusiness}
                userEmail={session?.user?.email}
                onBusinessChange={handleBusinessChange}
            />

            <AdminNavigation activeSection={activeSection} onChange={setActiveSection} />

            {activeSection === 'overview' ? (
                <div className="flex flex-col gap-4">
                    {canCreateMembership ? (
                        <OnboardingChecklist
                            business={business}
                            servicesCount={servicesQuery.data?.length ?? servicesSnapshot.length}
                            membershipsCount={onboardingMembershipsQuery.data?.length ?? 1}
                            pendingInvitationsCount={
                                onboardingInvitationsQuery.data?.filter((invitation) => !invitation.acceptedAt && !invitation.isExpired)
                                    .length ?? 0
                            }
                            onOpenServices={() => setActiveSection('services')}
                            onOpenSettings={() => setActiveSection('settings')}
                            onOpenTeam={() => setActiveSection('team')}
                        />
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Serviços</p>
                            <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
                                {servicesQuery.data?.length ?? servicesSnapshot.length}
                            </p>
                            <p className="mt-2 text-xs text-slate-600 sm:text-sm">Itens ativos na agenda do salão.</p>
                        </Card>
                        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                            <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Funcionamento</p>
                            <p className="mt-3 text-lg font-semibold text-slate-900 sm:text-3xl">
                                {business.openTime} - {business.closeTime}
                            </p>
                            <p className="mt-2 text-xs text-slate-600 sm:text-sm">
                                Faixa horária usada para calcular disponibilidade.
                            </p>
                        </Card>
                        <PublicBookingLinkCard business={business} />
                        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                            <div className="flex h-full flex-col gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Agendamentos</p>
                                    <div className="mt-3 flex items-end justify-between gap-3">
                                        <div>
                                            <p className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                                                {appointmentsSummary.total}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                                                Total de agendamentos registrados.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="min-h-11 shrink-0 px-4 py-2 text-sm"
                                            onClick={() => setActiveSection('appointments')}
                                        >
                                            Ver agenda
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-amber-700">
                                            Agendados
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-slate-900">
                                            {appointmentsSummary.scheduled}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-emerald-700">
                                            Concluídos
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-slate-900">
                                            {appointmentsSummary.completed}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-rose-700">
                                            Cancelados
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-slate-900">
                                            {appointmentsSummary.canceled}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            ) : null}

            {activeSection === 'financial' ? (
                <FinancialSummarySection businessId={selectedBusinessId} enabled={isAuthenticated} />
            ) : null}

            {activeSection === 'settings' ? (
                <AvailabilitySection
                    business={business}
                    onSaved={(updatedBusiness) => {
                        setBusiness(updatedBusiness)
                    }}
                />
            ) : null}

            {activeSection === 'team' ? (
                <TeamSection
                    businessId={selectedBusinessId}
                    enabled={isAuthenticated}
                    canCreateMembership={canCreateMembership}
                    canManageMemberships={canManageMemberships}
                />
            ) : null}

            {activeSection === 'appointments' ? (
                <AppointmentsSection
                    businessId={selectedBusinessId}
                    enabled={isAuthenticated}
                    appointmentFilter={appointmentFilter}
                    onAppointmentFilterChange={setAppointmentFilter}
                    initialAppointments={
                        selectedBusinessId === currentBusinessId ? initialAppointments : undefined
                    }
                    onAppointmentStatusSaved={handleAppointmentStatusSaved}
                />
            ) : null}

            {activeSection === 'services' ? (
                <ServicesSection
                    businessId={selectedBusinessId}
                    enabled={isAuthenticated}
                    initialServices={servicesSnapshot}
                />
            ) : null}
        </main>
    )
}
