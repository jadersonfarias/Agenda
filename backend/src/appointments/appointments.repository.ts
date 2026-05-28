import { Injectable } from '@nestjs/common'
import { AppointmentStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { PaginationParams, PaginatedResult, buildPaginationMeta } from '../common/pagination'
import { AppointmentStatusFilter } from './appointment-status-filter'

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

type FindManyAppointmentsInput = {
  businessId: string
  statusFilter?: AppointmentStatusFilter
  assignedToUserId?: string
  pagination?: PaginationParams | null
}

type PublicCustomerPhoneLookupInput = {
  rawPhoneCandidates: string[]
  normalizedPhoneVariants: string[]
  startsAtOrAfter: Date
  businessId: string
}

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicByCustomerPhoneLookup({
    rawPhoneCandidates,
    normalizedPhoneVariants,
    startsAtOrAfter,
    businessId,
  }: PublicCustomerPhoneLookupInput) {
    if (rawPhoneCandidates.length === 0 || normalizedPhoneVariants.length === 0) {
      return []
    }

    const matchingCustomers = await this.prisma.customer.findMany({
      where: {
        businessId,
        phone: {
          in: rawPhoneCandidates,
        },
      },
      select: {
        id: true,
        phone: true,
        businessId: true,
      },
    })
    const normalizedVariants = new Set(normalizedPhoneVariants)
    const filteredCustomerMap = new Map<string, {
      id: string
      phone: string
      businessId: string
    }>()
    const addCustomerIfPhoneMatches = (customer: {
      id: string
      phone: string
      businessId: string
    }) => {
      if (customer.businessId !== businessId) {
        return
      }

      const normalizedPhone = customer.phone.replace(/\D/g, '')

      if (normalizedVariants.has(normalizedPhone)) {
        filteredCustomerMap.set(customer.id, customer)
      }
    }

    for (const customer of matchingCustomers) {
      addCustomerIfPhoneMatches(customer)
    }

    const filteredCustomers = [...filteredCustomerMap.values()]

    if (filteredCustomers.length === 0) {
      return []
    }

    const customerIds = filteredCustomers.map((customer: { id: string }) => customer.id)

    if (customerIds.length === 0) {
      return []
    }

    return this.prisma.appointment.findMany({
      where: {
        businessId,
        scheduledAt: {
          gte: startsAtOrAfter,
        },
        customerId: {
          in: customerIds,
        },
      },
      select: {
        id: true,
        publicToken: true,
        scheduledAt: true,
        status: true,
        price: true,
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    })
  }

  async findMany({
    businessId,
    statusFilter = 'all',
    assignedToUserId,
    pagination = null,
  }: FindManyAppointmentsInput) {
    const statusCondition =
      statusFilter === 'scheduled'
        ? { in: ['SCHEDULED'] as AppointmentStatus[] }
        : statusFilter === 'completed'
        ? { in: ['COMPLETED'] as AppointmentStatus[] }
        : statusFilter === 'canceled'
        ? { in: ['CANCELED'] as AppointmentStatus[] }
        : undefined

    const where = {
      businessId,
      ...(statusCondition ? { status: statusCondition } : {}),
      ...(assignedToUserId ? { assignedToUserId } : {}),
    }

    const select = {
      id: true,
      scheduledAt: true,
      completedAt: true,
      status: true,
      price: true,
      assignedToUserId: true,
      assignedToUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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
    }

    if (!pagination) {
      return this.prisma.appointment.findMany({
        where,
        select,
        orderBy: { scheduledAt: 'asc' },
      })
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        select,
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
      completedAt: Date | null
      price: unknown
      assignedToUserId: string | null
      assignedToUser: {
        id: string
        name: string
        email: string
      } | null
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
      select: {
        id: true,
        businessId: true,
        customerId: true,
        status: true,
        assignedToUserId: true,
      },
    })
  }

  async findByPublicToken(publicToken: string) {
    return this.prisma.appointment.findUnique({
      where: { publicToken },
      select: {
        id: true,
        publicToken: true,
        scheduledAt: true,
        status: true,
        price: true,
        businessId: true,
        customerId: true,
        service: {
          select: {
            name: true,
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
      },
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
    const result = await this.prisma.appointment.updateMany({
      where: { id, businessId },
      data: {
        status,
        completedAt: status === AppointmentStatus.COMPLETED ? new Date() : null,
      },
    })

    if (result.count === 0) {
      return null
    }

    return { id, status }
  }

  async updateAssignee(id: string, businessId: string, assignedToUserId: string | null) {
    const result = await this.prisma.appointment.updateMany({
      where: { id, businessId },
      data: { assignedToUserId },
    })

    if (result.count === 0) {
      return null
    }

    return this.prisma.appointment.findFirst({
      where: { id, businessId },
      select: {
        id: true,
        assignedToUserId: true,
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
