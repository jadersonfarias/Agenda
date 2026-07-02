'use client'

import { useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Clock3, LayoutGrid } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
    getAdminAppointmentsQueryBusinessKey,
    getAdminAppointmentsQueryKey,
} from '../../features/admin/hooks/use-admin-appointments-query'
import { useAdminInvitationsQuery } from '../../features/admin/hooks/use-admin-invitations-query'
import { useAdminMembershipsQuery } from '../../features/admin/hooks/use-admin-memberships-query'
import { useAdminServicesQuery } from '../../features/admin/hooks/use-admin-services-query'
import {
    canViewAdminSection,
    resolveAdminUiPermissions,
} from '../../features/admin/permissions'
import {
    type AdminAppointmentItem,
    type AdminAppointmentStatusFilter,
    type AdminBusinessOption,
    type AdminDashboardData,
} from '../../features/admin/types'
import { shouldShowSubscriptionPaymentCard } from '../../features/admin/subscription-payment'
import { fetchAdminDashboard } from '../../features/admin/services/admin-api.service'
import { useHydrated } from '../../hooks/use-hydrated'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { AdminHeader } from './AdminHeader'
import { AppointmentsSection } from './AppointmentsSection'
import { AvailabilitySection } from './AvailabilitySection'
import { AdminNavigation, adminSectionOptions, type AdminSectionId } from './AdminNavigation'
import { FinancialSummarySection } from './FinancialSummarySection'
import { OnboardingChecklist } from './OnboardingChecklist'
import { PublicBookingLinkCard } from './PublicBookingLinkCard'
import { ServicesSection } from './ServicesSection'
import { SubscriptionPaymentCard } from './SubscriptionPaymentCard'
import { TeamSection } from './TeamSection'

type AdminPanelProps = {
    initialData: AdminDashboardData
    initialAppointments: AdminAppointmentItem[]
    businesses: AdminBusinessOption[]
    currentBusinessId: string
}

const ADMIN_BUSINESS_STORAGE_KEY = 'admin.currentBusinessId'
const DEFAULT_ALLOWED_SECTION: AdminSectionId = 'appointments'

type AppointmentsSummary = {
    total: number
    scheduled: number
    completed: number
    canceled: number
}

function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 2.75v3.5M16 2.75v3.5M4.75 9h14.5" />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 5.25h10.5a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2V7.25a2 2 0 0 1 2-2Z"
            />
        </svg>
    )
}

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h15M13 6l6 6-6 6" />
        </svg>
    )
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3.5 2.25" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    )
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.6"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.25 4.25L19 7" />
        </svg>
    )
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="m7 7 10 10M17 7 7 17" />
        </svg>
    )
}

function TrendIcon({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.4"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4 16 5-5 4 4 7-8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7h5v5" />
        </svg>
    )
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

function resolveInitialSection(
    businesses: AdminBusinessOption[],
    businessId: string
): AdminSectionId {
    const role = businesses.find((item) => item.id === businessId)?.role ?? null
    const permissions = resolveAdminUiPermissions(role)

    return permissions.canViewOverview ? 'overview' : DEFAULT_ALLOWED_SECTION
}

export default function AdminPanel({
    initialData,
    initialAppointments,
    businesses,
    currentBusinessId,
}: AdminPanelProps) {
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const isHydrated = useHydrated()
    const hasResolvedStoredBusiness = useRef(false)
    const [selectedBusinessId, setSelectedBusinessId] = useState(currentBusinessId)
    const [business, setBusiness] = useState(initialData.business)
    const [servicesSnapshot, setServicesSnapshot] = useState(initialData.services)
    const [appointmentsSummary, setAppointmentsSummary] = useState<AppointmentsSummary>(
        resolveAppointmentsSummary(initialData)
    )
    const [activeSection, setActiveSection] = useState<AdminSectionId>(() =>
        resolveInitialSection(businesses, currentBusinessId)
    )
    const [appointmentFilter, setAppointmentFilter] = useState<AdminAppointmentStatusFilter>('scheduled')
    const [appointmentAssigneeFilter, setAppointmentAssigneeFilter] = useState('all')
    const [isSwitchingBusiness, setIsSwitchingBusiness] = useState(false)
    const isAuthenticated = Boolean(session?.accessToken)
    const currentBusinessRole = businesses.find((item) => item.id === selectedBusinessId)?.role ?? null
    const uiPermissions = resolveAdminUiPermissions(currentBusinessRole)
    const allowedSections = adminSectionOptions.filter((section) =>
        canViewAdminSection(uiPermissions, section.id)
    )
    const servicesQuery = useAdminServicesQuery(
        selectedBusinessId,
        isAuthenticated && uiPermissions.canViewServices
    )
    const servicesCount = servicesQuery.data?.length ?? servicesSnapshot.length
    const shouldShowPaymentCard =
        uiPermissions.canViewSubscriptionPayment &&
        isHydrated &&
        shouldShowSubscriptionPaymentCard(business, Date.now())
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
        setAppointmentAssigneeFilter('all')
        setIsSwitchingBusiness(false)
    }, [currentBusinessId, initialData])

    useEffect(() => {
        queryClient.setQueryData(
            getAdminAppointmentsQueryKey(currentBusinessId, 'scheduled'),
            initialAppointments
        )
    }, [currentBusinessId, initialAppointments, queryClient])

    useEffect(() => {
        const permissions = resolveAdminUiPermissions(currentBusinessRole)

        if (!canViewAdminSection(permissions, activeSection)) {
            setActiveSection(DEFAULT_ALLOWED_SECTION)
        }
    }, [activeSection, currentBusinessRole])

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

    const onboardingMembershipsQuery = useAdminMembershipsQuery(
        selectedBusinessId,
        isAuthenticated && activeSection === 'overview' && uiPermissions.canCreateMembership
    )
    const onboardingInvitationsQuery = useAdminInvitationsQuery(
        selectedBusinessId,
        isAuthenticated && activeSection === 'overview' && uiPermissions.canCreateInvitation
    )
    const appointmentMembersQuery = useAdminMembershipsQuery(
        selectedBusinessId,
        isAuthenticated && activeSection === 'appointments' && uiPermissions.canManageAppointmentAssignee,
        1,
        100
    )

    const handleBusinessChange = async (nextBusinessId: string) => {
        if (!nextBusinessId || nextBusinessId === selectedBusinessId) {
            return
        }

        setSelectedBusinessId(nextBusinessId)
        setAppointmentAssigneeFilter('all')
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
                userName={session?.user?.name}
                userRole={currentBusinessRole}
                onBusinessChange={handleBusinessChange}
            />

            <AdminNavigation
                activeSection={activeSection}
                sections={allowedSections}
                onChange={setActiveSection}
            />

            {shouldShowPaymentCard ? <SubscriptionPaymentCard business={business} /> : null}

            {activeSection === 'overview' && uiPermissions.canViewOverview ? (
                <div className="flex flex-col gap-4">
                    {uiPermissions.canCreateMembership ? (
                        <OnboardingChecklist
                            business={business}
                            servicesCount={servicesCount}
                            membershipsCount={onboardingMembershipsQuery.data?.meta.total ?? 1}
                            pendingInvitationsCount={
                                onboardingInvitationsQuery.data?.meta.total ?? 0
                            }
                            onOpenServices={() => setActiveSection('services')}
                            onOpenSettings={() => setActiveSection('settings')}
                            onOpenTeam={() => setActiveSection('team')}
                        />
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                        <Card className="group min-w-0 overflow-hidden border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/70 sm:p-6 lg:p-7">
                            <div className="flex h-full min-w-0 flex-col gap-5">
                                <div className="flex min-w-0 items-center gap-4">
                                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50 text-purple-600 shadow-inner shadow-purple-100/70 sm:size-14">
                                        <LayoutGrid className="size-6 sm:size-7" strokeWidth={1.9} />
                                    </span>
                                    <p className="min-w-0 text-xs font-semibold uppercase tracking-[.25em] text-slate-500 sm:text-sm">
                                        Serviços
                                    </p>
                                </div>

                                <div className="min-w-0">
                                    <p className="text-5xl font-black leading-none text-slate-950 sm:text-6xl">
                                        {servicesCount}
                                    </p>
                                    <p className="mt-3 text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                                        {servicesCount === 1 ? '1 serviço ativo' : `${servicesCount} serviços ativos`}
                                    </p>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                        Itens ativos na agenda do negócio.
                                    </p>
                                </div>

                                <div className="mt-auto flex w-fit max-w-full items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-xs font-semibold text-slate-700 sm:text-sm">
                                    <span className="size-2 shrink-0 rounded-full bg-purple-500" />
                                    <span className="min-w-0">
                                        {servicesCount > 0 ? 'Disponíveis para reserva' : 'Nenhum serviço cadastrado'}
                                    </span>
                                </div>
                            </div>
                        </Card>
                        <Card className="group min-w-0 overflow-hidden border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/70 sm:p-6 lg:p-7">
                            <div className="flex h-full min-w-0 flex-col gap-5">
                                <div className="flex min-w-0 items-center gap-4">
                                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50 text-purple-600 shadow-inner shadow-purple-100/70 sm:size-14">
                                        <CalendarClock className="size-6 sm:size-7" strokeWidth={1.9} />
                                    </span>
                                    <p className="min-w-0 text-xs font-semibold uppercase tracking-[.25em] text-slate-500 sm:text-sm">
                                        Funcionamento
                                    </p>
                                </div>

                                <p className="break-words text-3xl font-black leading-none text-slate-950 sm:text-4xl">
                                    {business.openTime} - {business.closeTime}
                                </p>

                                <div className="grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                                    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                                            <Clock3 className="size-5" strokeWidth={2} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-slate-500">Abertura</p>
                                            <p className="mt-0.5 text-lg font-bold leading-none text-slate-900">
                                                {business.openTime}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                                            <Clock3 className="size-5" strokeWidth={2} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-slate-500">Encerramento</p>
                                            <p className="mt-0.5 text-lg font-bold leading-none text-slate-900">
                                                {business.closeTime}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-auto text-sm leading-relaxed text-slate-600">
                                    Faixa horária usada para calcular disponibilidade.
                                </p>
                            </div>
                        </Card>
                        <PublicBookingLinkCard business={business} />
                        <Card className="border-slate-200 bg-white p-5 shadow-lg shadow-purple-100/60 sm:p-6">
                            <div className="flex h-full min-w-0 flex-col gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 shadow-inner shadow-purple-100">
                                        <CalendarIcon className="size-6" />
                                    </span>
                                    <p className="min-w-0 text-xs font-semibold uppercase tracking-[.28em] text-purple-700">
                                        Agendamentos
                                    </p>
                                </div>

                                <div className="flex min-w-0 flex-col gap-4">
                                    <div className="min-w-0">
                                        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                                            <p className="text-5xl font-black leading-none text-slate-950">
                                                {appointmentsSummary.total}
                                            </p>
                                            <p className="text-xl font-bold leading-tight text-slate-950">
                                                {appointmentsSummary.total === 1 ? 'agendamento' : 'agendamentos'}
                                            </p>
                                        </div>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            {appointmentsSummary.scheduled}{' '}
                                            {appointmentsSummary.scheduled === 1
                                                ? 'ainda aguarda atendimento.'
                                                : 'ainda aguardam atendimento.'}
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="!min-h-11 !w-full min-w-0 gap-2 rounded-2xl border border-purple-200 !bg-white px-4 py-2 text-sm font-bold !text-purple-700 shadow-sm shadow-purple-100/60 hover:!bg-purple-50 focus:ring-purple-200"
                                        onClick={() => setActiveSection('appointments')}
                                    >
                                        <CalendarIcon className="size-5 shrink-0" />
                                        <span>Ver agenda</span>
                                        <ArrowRightIcon className="size-5 shrink-0" />
                                    </Button>
                                </div>

                                <div className="h-px w-full bg-slate-200" />

                                <div className="grid min-w-0 grid-cols-3 gap-2">
                                    <div className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50/80 p-2.5 shadow-sm shadow-amber-100/50">
                                        <div className="flex min-w-0 flex-col gap-2">
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                                <ClockIcon className="size-5" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-xl font-bold leading-none text-slate-950">
                                                    {appointmentsSummary.scheduled}
                                                </p>
                                                <p className="mt-1 text-[11px] font-medium leading-tight text-slate-700">
                                                    Agendados
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="min-w-0 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-2.5 shadow-sm shadow-emerald-100/50">
                                        <div className="flex min-w-0 flex-col gap-2">
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                                <CheckIcon className="size-5" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-xl font-bold leading-none text-slate-950">
                                                    {appointmentsSummary.completed}
                                                </p>
                                                <p className="mt-1 text-[11px] font-medium leading-tight text-slate-700">
                                                    Concluídos
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="min-w-0 rounded-2xl border border-rose-200 bg-rose-50/80 p-2.5 shadow-sm shadow-rose-100/50">
                                        <div className="flex min-w-0 flex-col gap-2">
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                                                <XIcon className="size-5" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-xl font-bold leading-none text-slate-950">
                                                    {appointmentsSummary.canceled}
                                                </p>
                                                <p className="mt-1 text-[11px] font-medium leading-tight text-slate-700">
                                                    Cancelados
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="flex min-w-0 items-start gap-2 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
                                    <TrendIcon className="mt-0.5 size-4 shrink-0 text-purple-700" />
                                    <span>
                                        {appointmentsSummary.completed > 0
                                            ? `${appointmentsSummary.completed} atendimento${
                                                appointmentsSummary.completed === 1 ? '' : 's'
                                            } concluído${
                                                appointmentsSummary.completed === 1 ? '' : 's'
                                            } este mês`
                                            : 'Nenhum atendimento concluído este mês'}
                                    </span>
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            ) : null}

            {activeSection === 'financial' && uiPermissions.canViewFinancial ? (
                <FinancialSummarySection
                    businessId={selectedBusinessId}
                    enabled={isAuthenticated}
                    onNavigateToAppointments={() => setActiveSection('appointments')}
                />
            ) : null}

            {activeSection === 'settings' && uiPermissions.canViewSettings ? (
                <AvailabilitySection
                    business={business}
                    onSaved={(updatedBusiness) => {
                        setBusiness(updatedBusiness)
                    }}
                />
            ) : null}

            {activeSection === 'team' && uiPermissions.canViewTeam ? (
                <TeamSection
                    businessId={selectedBusinessId}
                    enabled={isAuthenticated}
                    canCreateMembership={uiPermissions.canCreateMembership}
                    canManageMemberships={uiPermissions.canManageMemberships}
                />
            ) : null}

            {activeSection === 'appointments' && uiPermissions.canViewAppointments ? (
                <AppointmentsSection
                    businessId={selectedBusinessId}
                    enabled={isAuthenticated}
                    appointmentFilter={appointmentFilter}
                    onAppointmentFilterChange={setAppointmentFilter}
                    assignedToUserIdFilter={appointmentAssigneeFilter}
                    onAssignedToUserIdFilterChange={setAppointmentAssigneeFilter}
                    canManageAppointmentAssignee={uiPermissions.canManageAppointmentAssignee}
                    assignableMembers={appointmentMembersQuery.data?.data ?? []}
                    initialAppointments={
                        selectedBusinessId === currentBusinessId && appointmentAssigneeFilter === 'all'
                            ? initialAppointments
                            : undefined
                    }
                    onAppointmentStatusSaved={handleAppointmentStatusSaved}
                />
            ) : null}

            {activeSection === 'services' && uiPermissions.canViewServices ? (
                <ServicesSection
                    businessId={selectedBusinessId}
                    enabled={isAuthenticated}
                    initialServices={servicesSnapshot}
                />
            ) : null}
        </main>
    )
}
