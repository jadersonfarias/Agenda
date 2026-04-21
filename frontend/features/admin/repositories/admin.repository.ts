import { prisma } from '../../../lib/prisma'

export class AdminRepository {
    async countCustomersByBusinessId(businessId: string, activeSince: Date) {
        const [activeCustomers, inactiveCustomers] = await Promise.all([
            prisma.customer.count({
                where: {
                    businessId,
                    lastVisitAt: {
                        gte: activeSince,
                    },
                },
            } as never),
            prisma.customer.count({
                where: {
                    businessId,
                    OR: [
                        { lastVisitAt: null },
                        {
                            lastVisitAt: {
                                lt: activeSince,
                            },
                        },
                    ],
                },
            } as never),
        ])

        return { activeCustomers, inactiveCustomers }
    }

    async aggregateMonthlyRevenue(input: { businessId: string; rangeStart: Date; rangeEnd: Date }) {
        return prisma.appointment.aggregate({
            where: {
                businessId: input.businessId,
                status: 'COMPLETED',
                completedAt: {
                    gte: input.rangeStart,
                    lt: input.rangeEnd,
                },
            },
            _sum: {
                price: true,
            },
            _count: {
                _all: true,
            },
        } as never)
    }

    async findBusinessByOwnerId(ownerId: string) {
        return prisma.business.findFirst({
            where: { ownerId },
            orderBy: { createdAt: 'asc' },
        })
    }

    async listServicesByBusinessId(businessId: string) {
        return prisma.service.findMany({
            where: { businessId },
            include: {
                _count: {
                    select: {
                        appointments: true,
                    },
                },
            },
            orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
        })
    }

    async createService(input: { businessId: string; name: string; price: number; durationMinutes: number }) {
        return prisma.service.create({
            data: {
                businessId: input.businessId,
                name: input.name,
                price: input.price,
                durationMinutes: input.durationMinutes,
            },
        })
    }

    async findServiceById(serviceId: string) {
        return prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                _count: {
                    select: {
                        appointments: true,
                    },
                },
            },
        })
    }

    async updateService(input: { serviceId: string; name: string; price: number; durationMinutes: number }) {
        return prisma.service.update({
            where: { id: input.serviceId },
            data: {
                name: input.name,
                price: input.price,
                durationMinutes: input.durationMinutes,
            },
        })
    }

    async deleteService(serviceId: string) {
        return prisma.service.delete({
            where: { id: serviceId },
        })
    }

    async updateBusinessAvailability(input: { businessId: string; openTime: string; closeTime: string }) {
        return prisma.business.update({
            where: { id: input.businessId },
            data: {
                openTime: input.openTime,
                closeTime: input.closeTime,
            },
        })
    }
}
