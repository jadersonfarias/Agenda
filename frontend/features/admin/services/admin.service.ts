import { revalidatePath } from 'next/cache'
import { AdminRepository } from '../repositories/admin.repository'
import { availabilityFormSchema, serviceFormSchema } from '../schemas'
import { AdminDashboardData, AdminMonthlySummary, AdminServiceItem } from '../types'

const repository = new AdminRepository()
const ACTIVE_CUSTOMER_WINDOW_DAYS = 90

function toAdminServiceItem(service: Awaited<ReturnType<AdminRepository['findServiceById']>>): AdminServiceItem {
    if (!service) {
        throw new Error('Serviço não encontrado')
    }

    return {
        id: service.id,
        name: service.name,
        price: service.price.toString(),
        durationMinutes: service.durationMinutes,
        appointmentCount: service._count.appointments,
        createdAt: service.createdAt.toISOString(),
    }
}

async function getManagedBusinessOrThrow(userId: string) {
    console.log('Buscando negócio para o usuário:', userId)
    const business = await repository.findBusinessByOwnerId(userId)
   console.log('Negócio encontrado para o usuário:', business)
    if (!business) {
        throw new Error('Nenhum negócio vinculado a este usuário')
    }

    return business
}

function normalizeMonth(month?: string) {
    const currentDate = new Date()
    const fallback = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    const value = month ?? fallback

    if (!/^\d{4}-\d{2}$/.test(value)) {
        throw new Error('month deve estar no formato YYYY-MM')
    }

    const [year, monthNumber] = value.split('-').map(Number)

    if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
        throw new Error('month inválido')
    }

    return value
}

export async function getAdminDashboardData(userId: string): Promise<AdminDashboardData> {
    const business = await getManagedBusinessOrThrow(userId)
    const services = await repository.listServicesByBusinessId(business.id)

    return {
        business: {
            id: business.id,
            name: business.name,
            slug: business.slug,
            openTime: business.openTime,
            closeTime: business.closeTime,
        },
        services: services.map((service) => toAdminServiceItem(service)),
    }
}

export async function listAdminServices(userId: string): Promise<AdminServiceItem[]> {
    const business = await getManagedBusinessOrThrow(userId)
    const services = await repository.listServicesByBusinessId(business.id)

    return services.map((service) => toAdminServiceItem(service))
}

export async function getAdminMonthlySummary(userId: string, month?: string): Promise<AdminMonthlySummary> {
    const business = await getManagedBusinessOrThrow(userId)
    const normalizedMonth = normalizeMonth(month)
    const [year, monthNumber] = normalizedMonth.split('-').map(Number)
    const rangeStart = new Date(Date.UTC(year, monthNumber - 1, 1))
    const rangeEnd = new Date(Date.UTC(year, monthNumber, 1))
    const activeSince = new Date()
    activeSince.setDate(activeSince.getDate() - ACTIVE_CUSTOMER_WINDOW_DAYS)

    const [monthlyRevenue, customerCounts] = await Promise.all([
        repository.aggregateMonthlyRevenue({
            businessId: business.id,
            rangeStart,
            rangeEnd,
        }),
        repository.countCustomersByBusinessId(business.id, activeSince),
    ])

    const monthlyRevenueSummary = monthlyRevenue as {
        _sum?: { price?: unknown }
        _count?: { _all?: number }
    }
    const totalRevenue = Number(monthlyRevenueSummary._sum?.price ?? 0)
    const completedAppointments = monthlyRevenueSummary._count?._all ?? 0
    const averageTicket = completedAppointments > 0 ? totalRevenue / completedAppointments : 0

    return {
        month: normalizedMonth,
        totalRevenue: totalRevenue.toFixed(2),
        completedAppointments,
        averageTicket: averageTicket.toFixed(2),
        activeCustomers: customerCounts.activeCustomers,
        inactiveCustomers: customerCounts.inactiveCustomers,
        activeCustomerWindowDays: ACTIVE_CUSTOMER_WINDOW_DAYS,
    }
}

export async function createAdminService(userId: string, input: unknown) {
    const business = await getManagedBusinessOrThrow(userId)
    const data = serviceFormSchema.parse(input)

    const service = await repository.createService({
        businessId: business.id,
        name: data.name,
        price: data.price,
        durationMinutes: data.durationMinutes,
    })

    revalidatePath('/admin')

    const created = await repository.findServiceById(service.id)
    return toAdminServiceItem(created)
}

export async function updateAdminService(userId: string, serviceId: string, input: unknown) {
    const business = await getManagedBusinessOrThrow(userId)
    const currentService = await repository.findServiceById(serviceId)

    if (!currentService || currentService.businessId !== business.id) {
        throw new Error('Serviço não encontrado para este negócio')
    }

    const data = serviceFormSchema.parse(input)

    await repository.updateService({
        serviceId,
        name: data.name,
        price: data.price,
        durationMinutes: data.durationMinutes,
    })

    revalidatePath('/admin')

    const updated = await repository.findServiceById(serviceId)
    return toAdminServiceItem(updated)
}

export async function deleteAdminService(userId: string, serviceId: string) {
    const business = await getManagedBusinessOrThrow(userId)
    const service = await repository.findServiceById(serviceId)

    if (!service || service.businessId !== business.id) {
        throw new Error('Serviço não encontrado para este negócio')
    }

    if (service._count.appointments > 0) {
        throw new Error('Este serviço possui agendamentos e não pode ser removido')
    }

    await repository.deleteService(serviceId)
    revalidatePath('/admin')
}

export async function updateAdminAvailability(userId: string, input: unknown) {
    const business = await getManagedBusinessOrThrow(userId)
    const data = availabilityFormSchema.parse(input)

    const updatedBusiness = await repository.updateBusinessAvailability({
        businessId: business.id,
        openTime: data.openTime,
        closeTime: data.closeTime,
    })

    revalidatePath('/admin')

    return {
        id: updatedBusiness.id,
        name: updatedBusiness.name,
        slug: updatedBusiness.slug,
        openTime: updatedBusiness.openTime,
        closeTime: updatedBusiness.closeTime,
    }
}
