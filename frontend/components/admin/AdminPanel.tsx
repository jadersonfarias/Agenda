'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAdminAppointmentsQuery } from '../../features/admin/hooks/use-admin-appointments-query'
import { useAdminServicesQuery } from '../../features/admin/hooks/use-admin-services-query'
import { type AdminAppointmentStatusFilter, type AdminBusinessOption, type AdminDashboardData } from '../../features/admin/types'
import { decodeAccessToken } from '../../lib/access-token'
import { fetchAdminDashboard } from '../../features/admin/services/admin-api.service'
import { Card } from '../ui/card'
import { AdminHeader } from './AdminHeader'
import { AppointmentsSection } from './AppointmentsSection'
import { AvailabilitySection } from './AvailabilitySection'
import { AdminNavigation, type AdminSectionId } from './AdminNavigation'
import { FinancialSummarySection } from './FinancialSummarySection'
import { ServicesSection } from './ServicesSection'
import { TeamSection } from './TeamSection'

type AdminPanelProps = {
    initialData: AdminDashboardData
    businesses: AdminBusinessOption[]
    currentBusinessId: string
}

const ADMIN_BUSINESS_STORAGE_KEY = 'admin.currentBusinessId'

export default function AdminPanel({ initialData, businesses, currentBusinessId }: AdminPanelProps) {
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const hasResolvedStoredBusiness = useRef(false)
    const [selectedBusinessId, setSelectedBusinessId] = useState(currentBusinessId)
    const [business, setBusiness] = useState(initialData.business)
    const [servicesSnapshot, setServicesSnapshot] = useState(initialData.services)
    const [activeSection, setActiveSection] = useState<AdminSectionId>('overview')
    const [appointmentFilter, setAppointmentFilter] = useState<AdminAppointmentStatusFilter>('active')
    const [isSwitchingBusiness, setIsSwitchingBusiness] = useState(false)
    const isAuthenticated = Boolean(session?.accessToken)
    const servicesQuery = useAdminServicesQuery(selectedBusinessId, isAuthenticated)
    const appointmentsQuery = useAdminAppointmentsQuery(selectedBusinessId, appointmentFilter, isAuthenticated)

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
        setIsSwitchingBusiness(false)
    }, [currentBusinessId, initialData])

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
            queryClient.setQueryData(['admin-services', nextBusinessId], nextDashboard.services)

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['admin-services', nextBusinessId] }),
                queryClient.invalidateQueries({ queryKey: ['admin-memberships', nextBusinessId] }),
                queryClient.invalidateQueries({ queryKey: ['admin-appointments', nextBusinessId] }),
                queryClient.invalidateQueries({ queryKey: ['admin-monthly-summary', nextBusinessId] }),
            ])
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível trocar o negócio atual'

            toast.error(message)
            setSelectedBusinessId(currentBusinessId)
            setBusiness(initialData.business)
            setServicesSnapshot(initialData.services)
            setIsSwitchingBusiness(false)

            if (typeof window !== 'undefined') {
                window.localStorage.setItem(ADMIN_BUSINESS_STORAGE_KEY, currentBusinessId)
            }

            updateAdminUrl(currentBusinessId)
        }
    }

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 overflow-x-hidden px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
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
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                        <p className="mt-2 text-xs text-slate-600 sm:text-sm">Faixa horária usada para calcular disponibilidade.</p>
                    </Card>
                    <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                        <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Reserva pública</p>
                        <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">/</p>
                        <p className="mt-2 text-xs text-slate-600 sm:text-sm">Mudanças aqui refletem na página de agendamento.</p>
                    </Card>
                    <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                        <p className="text-xs uppercase tracking-[.25em] text-slate-500 sm:text-sm">Agendamentos</p>
                        <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{appointmentsQuery.data?.length ?? 0}</p>
                        <p className="mt-2 text-xs text-slate-600 sm:text-sm">Total de agendamentos registrados.</p>
                    </Card>
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
