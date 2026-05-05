import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PaginationParams, PaginatedResult, buildPaginationMeta } from '../common/pagination'

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBusinessById(businessId: string) {
    return this.prisma.business.findFirst({
      where: {
        OR: [{ id: businessId }, { slug: businessId }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        openTime: true,
        closeTime: true,
        timezone: true,
      },
    })
  }

  async findBusinessByOwnerId(ownerId: string) {
    return this.prisma.business.findFirst({
      where: { ownerId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async listServicesByBusinessId(businessId: string, pagination: PaginationParams | null = null) {
    const where = { businessId }

    if (!pagination) {
      return this.prisma.service.findMany({
        where,
        select: {
          id: true,
          name: true,
          price: true,
          durationMinutes: true,
          createdAt: true,
          _count: {
            select: {
              appointments: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
      })
    }

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        select: {
          id: true,
          name: true,
          price: true,
          durationMinutes: true,
          createdAt: true,
          _count: {
            select: {
              appointments: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
        skip: (pagination.page - 1) * pagination.perPage,
        take: pagination.perPage,
      }),
      this.prisma.service.count({ where }),
    ])

    return {
      data,
      meta: buildPaginationMeta(total, pagination),
    } as PaginatedResult<{
      id: string
      name: string
      price: string
      durationMinutes: number
      createdAt: Date
      _count: {
        appointments: number
      }
    }>
  }

  async findServiceById(serviceId: string) {
    return this.prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        businessId: true,
        name: true,
        price: true,
        durationMinutes: true,
        createdAt: true,
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    })
  }

  async createService(input: { businessId: string; name: string; price: number; durationMinutes: number }) {
    return this.prisma.service.create({
      data: {
        businessId: input.businessId,
        name: input.name,
        price: input.price,
        durationMinutes: input.durationMinutes,
      },
      select: {
        id: true,
        businessId: true,
        name: true,
        price: true,
        durationMinutes: true,
        createdAt: true,
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    })
  }

  async updateService(input: { serviceId: string; name: string; price: number; durationMinutes: number }) {
    return this.prisma.service.update({
      where: { id: input.serviceId },
      data: {
        name: input.name,
        price: input.price,
        durationMinutes: input.durationMinutes,
      },
      select: {
        id: true,
        businessId: true,
        name: true,
        price: true,
        durationMinutes: true,
        createdAt: true,
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    })
  }

  async deleteService(serviceId: string) {
    return this.prisma.service.delete({
      where: { id: serviceId },
    })
  }

  async updateBusinessAvailability(input: { businessId: string; openTime: string; closeTime: string }) {
    return this.prisma.business.update({
      where: { id: input.businessId },
      data: {
        openTime: input.openTime,
        closeTime: input.closeTime,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        openTime: true,
        closeTime: true,
      },
    })
  }

  async countCustomersByBusinessId(businessId: string, activeSince: Date) {
    const [activeCustomers, inactiveCustomers] = await Promise.all([
      this.prisma.customer.count({
        where: {
          businessId,
          lastVisitAt: {
            gte: activeSince,
          },
        },
      }),
      this.prisma.customer.count({
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
      }),
    ])

    return { activeCustomers, inactiveCustomers }
  }

  async aggregateMonthlyRevenue(input: { businessId: string; rangeStart: Date; rangeEnd: Date }) {
    return this.prisma.appointment.aggregate({
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
    })
  }
}
