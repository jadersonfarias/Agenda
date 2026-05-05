import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PaginationParams, PaginatedResult, buildPaginationMeta } from '../common/pagination'

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
}
