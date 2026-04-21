import { Injectable } from '@nestjs/common'
import { AppointmentStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

type ConflictRangeInput = {
  businessId: string
  rangeStart: Date
  rangeEnd: Date
}

@Injectable()
export class BusinessesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBusinessById(businessId: string) {
    return this.prisma.business.findFirst({
      where: {
        OR: [{ id: businessId }, { slug: businessId }],
      },
    })
  }

  async findServices(businessId: string) {
    return this.prisma.service.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        price: true,
        durationMinutes: true,
      },
      orderBy: { name: 'asc' },
    })
  }

  async findAppointmentsInRange({ businessId, rangeStart, rangeEnd }: ConflictRangeInput) {
    return this.prisma.appointment.findMany({
      where: {
        businessId,
        status: {
          not: AppointmentStatus.CANCELED,
        },
        scheduledAt: { lt: rangeEnd },
        endsAt: { gt: rangeStart },
      },
      select: {
        scheduledAt: true,
        endsAt: true,
      },
      orderBy: { scheduledAt: 'asc' },
    })
  }

  async findCustomerByPhone(businessId: string, phone: string) {
    return this.prisma.customer.findUnique({
      where: {
        businessId_phone: {
          businessId,
          phone,
        },
      },
    })
  }

  async createCustomer(businessId: string, name: string, phone: string) {
    return this.prisma.customer.create({
      data: {
        name,
        phone,
        business: { connect: { id: businessId } },
      },
    })
  }

  async updateCustomerName(customerId: string, name: string) {
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { name },
    })
  }

  async updateCustomerLastVisitAt(customerId: string, lastVisitAt: Date | null) {
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { lastVisitAt },
    })
  }

  async findServiceById(serviceId: string) {
    return this.prisma.service.findUnique({
      where: { id: serviceId },
    })
  }

  async findConflicts(businessId: string, startsAt: Date, endsAt: Date) {
    return this.prisma.appointment.findFirst({
      where: {
        businessId,
        status: {
          not: AppointmentStatus.CANCELED,
        },
        scheduledAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: {
        id: true,
      },
    })
  }
}
