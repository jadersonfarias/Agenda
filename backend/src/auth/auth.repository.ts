import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async listBusinessesByUserId(userId: string) {
    return this.prisma.membership.findMany({
      where: { userId },
      select: {
        role: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'asc' },
        { business: { createdAt: 'asc' } },
      ],
    })
  }
}
