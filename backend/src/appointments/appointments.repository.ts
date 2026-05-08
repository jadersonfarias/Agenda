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

type PublicAppointmentRow = {
  id: string
  publicToken: string
  scheduledAt: Date
  price: unknown
  status: AppointmentStatus
  businessId: string
  serviceName: string
  customerName: string
}

type PublicCustomerAppointmentRow = {
  id: string
  publicToken: string
  scheduledAt: Date
  price: unknown
  status: AppointmentStatus
  serviceName: string
}

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

  async ensurePublicToken(appointmentId: string) {
    const [appointment] = await this.prisma.$queryRaw<Array<{ publicToken: string }>>`
      UPDATE "Appointment"
      SET "publicToken" = COALESCE("publicToken", gen_random_uuid()::text)
      WHERE "id" = ${appointmentId}
      RETURNING "publicToken"
    `

    return appointment?.publicToken ?? null
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

  async findPublicByToken(token: string) {
    const [appointment] = await this.prisma.$queryRaw<PublicAppointmentRow[]>`
      SELECT
        a."id",
        a."publicToken",
        a."scheduledAt",
        a."price",
        a."status",
        a."businessId",
        s."name" AS "serviceName",
        c."name" AS "customerName"
      FROM "Appointment" a
      INNER JOIN "Service" s ON s."id" = a."serviceId"
      INNER JOIN "Customer" c ON c."id" = a."customerId"
      WHERE a."publicToken" = ${token}
      LIMIT 1
    `

    return appointment ?? null
  }

  async cancelByPublicToken(token: string) {
    const [appointment] = await this.prisma.$queryRaw<Array<{ id: string; status: AppointmentStatus; businessId: string }>>`
      UPDATE "Appointment"
      SET
        "status" = 'CANCELED'::"AppointmentStatus",
        "completedAt" = NULL,
        "updatedAt" = NOW()
      WHERE "publicToken" = ${token}
      RETURNING "id", "status", "businessId"
    `

    return appointment ?? null
  }

  async findPublicByCustomerPhone(phoneDigits: string, businessId?: string) {
    if (businessId) {
      return this.prisma.$queryRaw<PublicCustomerAppointmentRow[]>`
        SELECT
          a."id",
          a."publicToken",
          a."scheduledAt",
          a."price",
          a."status",
          s."name" AS "serviceName"
        FROM "Appointment" a
        INNER JOIN "Service" s ON s."id" = a."serviceId"
        INNER JOIN "Customer" c ON c."id" = a."customerId"
        WHERE regexp_replace(c."phone", '[^0-9]', '', 'g') = ${phoneDigits}
          AND a."status" = 'SCHEDULED'::"AppointmentStatus"
          AND a."scheduledAt" >= NOW()
          AND a."businessId" = ${businessId}
        ORDER BY a."scheduledAt" ASC
        LIMIT 50
      `
    }

    return this.prisma.$queryRaw<PublicCustomerAppointmentRow[]>`
      SELECT
        a."id",
        a."publicToken",
        a."scheduledAt",
        a."price",
        a."status",
        s."name" AS "serviceName"
      FROM "Appointment" a
      INNER JOIN "Service" s ON s."id" = a."serviceId"
      INNER JOIN "Customer" c ON c."id" = a."customerId"
      WHERE regexp_replace(c."phone", '[^0-9]', '', 'g') = ${phoneDigits}
        AND a."status" = 'SCHEDULED'::"AppointmentStatus"
        AND a."scheduledAt" >= NOW()
      ORDER BY a."scheduledAt" ASC
      LIMIT 50
    `
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
