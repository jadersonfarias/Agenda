import { Injectable } from '@nestjs/common'
import { AdminRepository } from './admin.repository'
import { PaginationParams } from '../common/pagination'

type AdminServiceRecord = Awaited<ReturnType<AdminRepository['listServicesByBusinessId']>>[number]

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async listServices(businessId: string, pagination: PaginationParams | null = null) {
    const services = await this.adminRepository.listServicesByBusinessId(businessId, pagination)

    return pagination
      ? {
          data: services.data.map((service: AdminServiceRecord) => ({
            id: service.id,
            name: service.name,
            price: service.price.toString(),
            durationMinutes: service.durationMinutes,
            appointmentCount: service._count.appointments,
            createdAt: service.createdAt.toISOString(),
          })),
          meta: services.meta,
        }
      : services.map((service: AdminServiceRecord) => ({
          id: service.id,
          name: service.name,
          price: service.price.toString(),
          durationMinutes: service.durationMinutes,
          appointmentCount: service._count.appointments,
          createdAt: service.createdAt.toISOString(),
        }))
  }
}
