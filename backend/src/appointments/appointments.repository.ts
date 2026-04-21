import { Injectable } from '@nestjs/common'
import { AppointmentStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

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

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(businessId: string) {
    return this.prisma.appointment.findMany({
      where: { businessId },
      include: {
        service: true,
        customer: true,
      },
      orderBy: { scheduledAt: 'asc' },
    })
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
    return this.prisma.appointment.updateMany({
      where: { id, businessId },
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
