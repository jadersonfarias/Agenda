import { Injectable } from '@nestjs/common'
import { hash } from 'bcryptjs'
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

  async findFirstBusinessByUserId(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        business: {
          select: {
            id: true,
          },
        },
      },
    })

    if (membership?.business.id) {
      return membership.business.id
    }

    const ownedBusiness = await this.prisma.business.findFirst({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
      },
    })

    return ownedBusiness?.id ?? null
  }

  async listMembershipsByBusinessId(businessId: string) {
    return this.prisma.membership.findMany({
      where: { businessId },
      select: {
        id: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' },
      ],
    })
  }

  async findMembershipById(membershipId: string) {
    return this.prisma.membership.findUnique({
      where: { id: membershipId },
      select: {
        id: true,
        businessId: true,
        userId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  async findMembershipByUserAndBusinessId(userId: string, businessId: string) {
    return this.prisma.membership.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
      select: {
        id: true,
        businessId: true,
        userId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })
  }

  async listInvitationsByBusinessId(businessId: string) {
    return this.prisma.$queryRaw<Array<{
      id: string
      email: string
      role: 'OWNER' | 'ADMIN' | 'STAFF'
      token: string
      expiresAt: Date
      acceptedAt: Date | null
      createdAt: Date
    }>>`
      SELECT
        "id",
        "email",
        "role"::text AS "role",
        "token",
        "expiresAt",
        "acceptedAt",
        "createdAt"
      FROM "Invitation"
      WHERE "businessId" = ${businessId}
        AND "acceptedAt" IS NULL
      ORDER BY "createdAt" DESC, "email" ASC
    `
  }

  async findPendingInvitationByBusinessAndEmail(businessId: string, email: string) {
    const invitations = await this.prisma.$queryRaw<Array<{
      id: string
      email: string
      role: 'OWNER' | 'ADMIN' | 'STAFF'
      token: string
      expiresAt: Date
      acceptedAt: Date | null
      createdAt: Date
    }>>`
      SELECT
        "id",
        "email",
        "role"::text AS "role",
        "token",
        "expiresAt",
        "acceptedAt",
        "createdAt"
      FROM "Invitation"
      WHERE "businessId" = ${businessId}
        AND "email" = ${email}
        AND "acceptedAt" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT 1
    `

    return invitations[0] ?? null
  }

  async createInvitation(input: {
    businessId: string
    email: string
    role: 'OWNER' | 'ADMIN' | 'STAFF'
    token: string
    expiresAt: Date
  }) {
    const invitations = await this.prisma.$queryRaw<Array<{
      id: string
      email: string
      role: 'OWNER' | 'ADMIN' | 'STAFF'
      token: string
      expiresAt: Date
      acceptedAt: Date | null
      createdAt: Date
    }>>`
      INSERT INTO "Invitation" ("id", "businessId", "email", "role", "token", "expiresAt", "createdAt")
      VALUES (gen_random_uuid(), ${input.businessId}, ${input.email}, ${input.role}::"Role", ${input.token}, ${input.expiresAt}, NOW())
      RETURNING
        "id",
        "email",
        "role"::text AS "role",
        "token",
        "expiresAt",
        "acceptedAt",
        "createdAt"
    `

    return invitations[0]
  }

  async findInvitationByToken(token: string) {
    const invitations = await this.prisma.$queryRaw<Array<{
      id: string
      businessId: string
      email: string
      role: 'OWNER' | 'ADMIN' | 'STAFF'
      token: string
      expiresAt: Date
      acceptedAt: Date | null
      createdAt: Date
      business: {
        id: string
        name: string
        slug: string
      }
    }>>`
      SELECT
        i."id",
        i."businessId",
        i."email",
        i."role"::text AS "role",
        i."token",
        i."expiresAt",
        i."acceptedAt",
        i."createdAt",
        json_build_object(
          'id', b."id",
          'name', b."name",
          'slug', b."slug"
        ) AS "business"
      FROM "Invitation" i
      INNER JOIN "Business" b ON b."id" = i."businessId"
      WHERE i."token" = ${token}
      LIMIT 1
    `

    return invitations[0] ?? null
  }

  async acceptInvitation(input: {
    invitationId: string
    businessId: string
    email: string
    role: 'OWNER' | 'ADMIN' | 'STAFF'
    name?: string
    password?: string
  }) {
    return this.prisma.$transaction(async (tx: Pick<PrismaService, 'user' | 'membership' | '$queryRaw'>) => {
      let user = await tx.user.findUnique({
        where: { email: input.email },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })

      if (!user) {
        const hashedPassword = await hash(input.password!, 10)

        user = await tx.user.create({
          data: {
            name: input.name!,
            email: input.email,
            password: hashedPassword,
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      }

      const membership = await tx.membership.create({
        data: {
          businessId: input.businessId,
          userId: user.id,
          role: input.role,
        },
        select: {
          id: true,
          businessId: true,
          userId: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      const invitations = await tx.$queryRaw<Array<{
        id: string
        email: string
        role: 'OWNER' | 'ADMIN' | 'STAFF'
        token: string
        expiresAt: Date
        acceptedAt: Date | null
        createdAt: Date
      }>>`
        UPDATE "Invitation"
        SET "acceptedAt" = NOW()
        WHERE "id" = ${input.invitationId}
        RETURNING
          "id",
          "email",
          "role"::text AS "role",
          "token",
          "expiresAt",
          "acceptedAt",
          "createdAt"
      `

      return {
        user,
        membership,
        invitation: invitations[0],
      }
    })
  }

  async countOwnersByBusinessId(businessId: string) {
    return this.prisma.membership.count({
      where: {
        businessId,
        role: 'OWNER',
      },
    })
  }

  async updateMembershipRole(membershipId: string, role: 'OWNER' | 'ADMIN' | 'STAFF') {
    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { role },
      select: {
        id: true,
        businessId: true,
        userId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  async createMembership(input: { businessId: string; userId: string; role: 'OWNER' | 'ADMIN' | 'STAFF' }) {
    return this.prisma.membership.create({
      data: {
        businessId: input.businessId,
        userId: input.userId,
        role: input.role,
      },
      select: {
        id: true,
        businessId: true,
        userId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  async deleteMembership(membershipId: string) {
    return this.prisma.membership.delete({
      where: { id: membershipId },
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

  async listAppointmentsByBusinessId(
    businessId: string,
    statusFilter: 'active' | 'completed' | 'all' = 'all',
    pagination: PaginationParams | null = null
  ) {
    const statusCondition =
      statusFilter === 'active'
        ? { in: ['SCHEDULED'] as const }
        : statusFilter === 'completed'
          ? { in: ['COMPLETED', 'CANCELED'] as const }
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
          completedAt: true,
          status: true,
          price: true,
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
          completedAt: true,
          status: true,
          price: true,
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
    }
  }

  async findAppointmentById(appointmentId: string, businessId: string) {
    return this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        businessId,
      },
      select: {
        id: true,
        customerId: true,
        status: true,
      },
    })
  }

  async updateAppointmentStatus(appointmentId: string, status: 'SCHEDULED' | 'COMPLETED' | 'CANCELED') {
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
      select: {
        id: true,
        status: true,
      },
    })
  }

  async findLatestCompletedForCustomer(customerId: string) {
    return this.prisma.appointment.findFirst({
      where: {
        customerId,
        status: 'COMPLETED',
      },
      orderBy: { scheduledAt: 'desc' },
      select: {
        scheduledAt: true,
      },
    })
  }

  async updateCustomerLastVisitAt(customerId: string, lastVisitAt: Date | null) {
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { lastVisitAt },
    })
  }
}
