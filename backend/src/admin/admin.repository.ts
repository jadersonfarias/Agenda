import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBusinessByOwnerId(ownerId: string) {
    return this.prisma.business.findFirst({
      where: { ownerId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async listServicesByBusinessId(businessId: string) {
    return this.prisma.service.findMany({
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
}
