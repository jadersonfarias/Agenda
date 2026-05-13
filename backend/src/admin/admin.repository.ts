import { Injectable } from '@nestjs/common'
import { AppointmentStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { PaginationParams, PaginatedResult, buildPaginationMeta } from '../common/pagination'
import { MembershipRole } from '../auth/role.types'

type TransactionClient = {
  user: {
    findUniqueOrThrow: (...args: any[]) => Promise<any>
    create: (...args: any[]) => Promise<any>
  }
  membership: {
    create: (...args: any[]) => Promise<any>
  }
  invitation: {
    update: (...args: any[]) => Promise<any>
  }
}

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async findServiceByIdAndBusinessId(id: string, businessId: string) {
    return this.prisma.service.findFirst({
      where: { id, businessId },
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
    })
  }

  async createService(input: {
    businessId: string
    name: string
    price: number
    durationMinutes: number
  }) {
    return this.prisma.service.create({
      data: input,
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
    })
  }

  async updateService(
    id: string,
    businessId: string,
    input: {
      name: string
      price: number
      durationMinutes: number
    }
  ) {
    await this.prisma.service.updateMany({
      where: { id, businessId },
      data: input,
    })

    return this.findServiceByIdAndBusinessId(id, businessId)
  }

  async deleteService(id: string, businessId: string) {
    return this.prisma.service.deleteMany({
      where: { id, businessId },
    })
  }

  async updateBusinessAvailability(
    businessId: string,
    input: {
      openTime: string
      closeTime: string
    }
  ) {
    await this.prisma.business.updateMany({
      where: { id: businessId },
      data: input,
    })

    return this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        openTime: true,
        closeTime: true,
      },
    })
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
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
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

  async findMembershipByIdAndBusinessId(id: string, businessId: string) {
    return this.prisma.membership.findFirst({
      where: { id, businessId },
      select: {
        id: true,
        userId: true,
        businessId: true,
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
        role: true,
      },
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

  async createMembership(input: {
    userId: string
    businessId: string
    role: MembershipRole
  }) {
    return this.prisma.membership.create({
      data: input,
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
    })
  }

  async updateMembershipRole(id: string, businessId: string, role: MembershipRole) {
    await this.prisma.membership.updateMany({
      where: { id, businessId },
      data: { role },
    })

    return this.findMembershipByIdAndBusinessId(id, businessId)
  }

  async deleteMembership(id: string, businessId: string) {
    return this.prisma.membership.deleteMany({
      where: { id, businessId },
    })
  }

  async listInvitationsByBusinessId(businessId: string) {
    return this.prisma.invitation.findMany({
      where: {
        businessId,
        acceptedAt: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { email: 'asc' }],
    })
  }

  async findPendingInvitationByBusinessAndEmail(businessId: string, email: string, now: Date) {
    return this.prisma.invitation.findFirst({
      where: {
        businessId,
        email,
        acceptedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      select: {
        id: true,
      },
    })
  }

  async findInvitationByToken(token: string) {
    return this.prisma.invitation.findUnique({
      where: { token },
      select: {
        id: true,
        businessId: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })
  }

  async createInvitation(input: {
    businessId: string
    email: string
    role: MembershipRole
    token: string
    expiresAt: Date
  }) {
    return this.prisma.invitation.create({
      data: input,
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
      },
    })
  }

  async acceptInvitation(input: {
    invitationId: string
    businessId: string
    email: string
    role: MembershipRole
    existingUserId?: string
    name?: string
    hashedPassword?: string
  }) {
    return this.prisma.$transaction(async (tx: TransactionClient) => {
      const user = input.existingUserId
        ? await tx.user.findUniqueOrThrow({
            where: { id: input.existingUserId },
            select: {
              id: true,
              name: true,
              email: true,
            },
          })
        : await tx.user.create({
            data: {
              name: input.name!,
              email: input.email,
              password: input.hashedPassword!,
            },
            select: {
              id: true,
              name: true,
              email: true,
            },
          })

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          businessId: input.businessId,
          role: input.role,
        },
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
      })

      const invitation = await tx.invitation.update({
        where: { id: input.invitationId },
        data: { acceptedAt: new Date() },
        select: {
          id: true,
          email: true,
          role: true,
          token: true,
          expiresAt: true,
          acceptedAt: true,
          createdAt: true,
        },
      })

      return { user, membership, invitation }
    })
  }

  async countCustomersByBusinessId(businessId: string) {
    return this.prisma.customer.count({
      where: { businessId },
    })
  }

  async countActiveCustomersByBusinessId(businessId: string, activeSince: Date) {
    return this.prisma.customer.count({
      where: {
        businessId,
        lastVisitAt: {
          gte: activeSince,
        },
      },
    })
  }

  async countCanceledAppointmentsInRange(businessId: string, rangeStart: Date, rangeEnd: Date) {
    return this.prisma.appointment.count({
      where: {
        businessId,
        status: AppointmentStatus.CANCELED,
        updatedAt: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },
    })
  }

  async listCompletedAppointmentsInRangeByService(businessId: string, rangeStart: Date, rangeEnd: Date) {
    return this.prisma.appointment.findMany({
      where: {
        businessId,
        status: AppointmentStatus.COMPLETED,
        completedAt: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },
      select: {
        price: true,
        serviceId: true,
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ service: { name: 'asc' } }, { completedAt: 'asc' }],
    })
  }
}
