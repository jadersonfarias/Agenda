import { Injectable } from '@nestjs/common'
import { AdminRepository } from './admin.repository'

type AdminServiceRecord = Awaited<ReturnType<AdminRepository['listServicesByBusinessId']>>[number]

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async listServices(userId: string) {
    const business = await this.adminRepository.findBusinessByOwnerId(userId)

    if (!business) {
      throw new Error('Nenhum negócio vinculado a este usuário')
    }

    const services = await this.adminRepository.listServicesByBusinessId(business.id)

    return services.map((service: AdminServiceRecord) => ({
      id: service.id,
      name: service.name,
      price: service.price.toString(),
      durationMinutes: service.durationMinutes,
      appointmentCount: service._count.appointments,
      createdAt: service.createdAt.toISOString(),
    }))
  }
}
