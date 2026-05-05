import { Injectable } from '@nestjs/common'
import { AppointmentStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { PaginationParams, PaginatedResult, buildPaginationMeta } from '../common/pagination'

type CreateAppointmentInput = {
  businessId: string
  serviceId: string
  customerId: string
  scheduledAt: Date
  endsAt: Date
  price: unknown
}

type MonthlyRevenueRange = {
  businessId: string
  rangeStart: Date
  rangeEnd: Date
}

type AppointmentStatusFilter = 'active' | 'completed' | 'all'

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    businessId: string,
    statusFilter: AppointmentStatusFilter = 'all',
    pagination: PaginationParams | null = null
  ) {
    const statusCondition =
      statusFilter === 'active'
        ? { in: ['SCHEDULED'] as AppointmentStatus[] }
        : statusFilter === 'completed'
        ? { in: ['COMPLETED', 'CANCELED'] as AppointmentStatus[] }
        : undefined

    const where = {
      businessId,
      ...(statusCondition ? { status: statusCondition } : {}),
    }

    if (!pagination) {
      return this.prisma.appointment.findMany({
        where,
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          service: {
            select: {
              id: true,
              name: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
      })
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          service: {
            select: {
              id: true,
              name: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        skip: (pagination.page - 1) * pagination.perPage,
        take: pagination.perPage,
      }),
      this.prisma.appointment.count({ where }),
    ])

    return {
      data,
      meta: buildPaginationMeta(total, pagination),
    } as PaginatedResult<{
      id: string
      scheduledAt: Date
      status: AppointmentStatus
      service: {
        id: string
        name: string
      }
      customer: {
        id: string
        name: string
        phone: string
      }
    }>
  }

  async findById(id: string, businessId: string) {
    return this.prisma.appointment.findFirst({
      where: { id, businessId },
      include: { service: true, customer: true },
    })
  }

  async create(data: CreateAppointmentInput) {
    return this.prisma.appointment.create({
      data: {
        scheduledAt: data.scheduledAt,
        endsAt: data.endsAt,
        price: data.price,
        business: { connect: { id: data.businessId } },
        service: { connect: { id: data.serviceId } },
        customer: { connect: { id: data.customerId } },
      },
      include: {
        service: true,
        customer: true,
      },
    })
  }

  async delete(id: string, businessId: string) {
    return this.prisma.appointment.deleteMany({
      where: { id, businessId },
    })
  }

  async updateStatus(id: string, businessId: string, status: AppointmentStatus) {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        status,
        completedAt: status === AppointmentStatus.COMPLETED ? new Date() : null,
      },
    })
  }

  async findLatestCompletedForCustomer(customerId: string) {
    return this.prisma.appointment.findFirst({
      where: {
        customerId,
        status: AppointmentStatus.COMPLETED,
      },
      orderBy: { scheduledAt: 'desc' },
      select: {
        scheduledAt: true,
      },
    })
  }

  async aggregateMonthlyRevenue({ businessId, rangeStart, rangeEnd }: MonthlyRevenueRange) {
    return this.prisma.appointment.aggregate({
      where: {
        businessId,
        status: AppointmentStatus.COMPLETED,
        completedAt: {
          gte: rangeStart,
          lt: rangeEnd,
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

  async findConflicts(businessId: string, scheduledAt: Date, endsAt: Date) {
    return this.prisma.appointment.findFirst({
      where: {
        businessId,
        status: {
          not: 'CANCELED',
        },
        scheduledAt: { lt: endsAt },
        endsAt: { gt: scheduledAt },
      },
      select: {
        id: true,
      },
    })
  }
}
