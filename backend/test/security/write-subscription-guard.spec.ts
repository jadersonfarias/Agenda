import { describe, expect, it, vi } from 'vitest'
import { AdminService } from '../../src/admin/admin.service'
import { AppointmentsService } from '../../src/appointments/appointments.service'

const PLAN_EXPIRED_ERROR = new Error('Plano expirado')

function createBlockedAdminService(adminRepository: Record<string, unknown> = {}) {
  const subscriptionService = {
    assertBusinessCanWrite: vi.fn().mockRejectedValue(PLAN_EXPIRED_ERROR),
  }
  const repository = {
    findInvitationByToken: vi.fn(),
    findUserByEmail: vi.fn(),
    findMembershipByIdAndBusinessId: vi.fn(),
    findServiceByIdAndBusinessId: vi.fn(),
    createService: vi.fn(),
    updateService: vi.fn(),
    deleteService: vi.fn(),
    updateBusinessAvailability: vi.fn(),
    createInvitation: vi.fn(),
    createMembership: vi.fn(),
    updateMembershipRole: vi.fn(),
    deleteMembership: vi.fn(),
    ...adminRepository,
  } as any

  return {
    repository,
    subscriptionService,
    service: new AdminService(
      repository,
      {} as any,
      {} as any,
      {} as any,
      subscriptionService as any,
    ),
  }
}

function createBlockedAppointmentsService({
  appointmentsRepository = {},
  businessesRepository = {},
}: {
  appointmentsRepository?: Record<string, unknown>
  businessesRepository?: Record<string, unknown>
} = {}) {
  const subscriptionService = {
    assertBusinessCanWrite: vi.fn().mockRejectedValue(PLAN_EXPIRED_ERROR),
  }
  const appointmentRepository = {
    findById: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    updateAssignee: vi.fn(),
    delete: vi.fn(),
    ...appointmentsRepository,
  } as any
  const businessRepository = {
    findBusinessById: vi.fn().mockResolvedValue({ id: 'business-1' }),
    findServiceById: vi.fn(),
    ...businessesRepository,
  } as any

  return {
    appointmentRepository,
    businessRepository,
    subscriptionService,
    service: new AppointmentsService(
      appointmentRepository,
      businessRepository,
      {} as any,
      {} as any,
      subscriptionService as any,
    ),
  }
}

describe('Bloqueio de escrita por assinatura', () => {
  it.each([
    {
      name: 'criar serviço',
      run: (service: AdminService) => service.createService('business-1', {
        businessId: 'business-1',
        name: 'Corte',
        description: null,
        price: 80,
        durationMinutes: 30,
      }),
    },
    {
      name: 'editar serviço',
      run: (service: AdminService) => service.updateService('service-1', 'business-1', {
        businessId: 'business-1',
        name: 'Corte',
        description: null,
        price: 80,
        durationMinutes: 30,
      }),
    },
    {
      name: 'excluir serviço',
      run: (service: AdminService) => service.deleteService('service-1', 'business-1'),
    },
    {
      name: 'atualizar horário do business',
      run: (service: AdminService) => service.updateBusinessAvailability('business-1', {
        businessId: 'business-1',
        openTime: '09:00',
        closeTime: '18:00',
      }),
    },
    {
      name: 'criar convite',
      run: (service: AdminService) => service.createInvitation('business-1', {
        businessId: 'business-1',
        email: 'staff@example.com',
        role: 'STAFF',
      }),
    },
    {
      name: 'criar membership',
      run: (service: AdminService) => service.createMembership('business-1', {
        businessId: 'business-1',
        email: 'staff@example.com',
        role: 'STAFF',
      }),
    },
    {
      name: 'alterar membership',
      run: (service: AdminService) => service.updateMembershipRole(
        'membership-1',
        'business-1',
        { businessId: 'business-1', role: 'ADMIN' },
      ),
    },
    {
      name: 'excluir membership',
      run: (service: AdminService) => service.deleteMembership('membership-1', 'business-1'),
    },
  ])('bloqueia $name antes de acessar o repository', async ({ run }) => {
    const { repository, subscriptionService, service } = createBlockedAdminService()

    await expect(run(service)).rejects.toBe(PLAN_EXPIRED_ERROR)

    expect(subscriptionService.assertBusinessCanWrite).toHaveBeenCalledWith('business-1')
    expect(repository.findUserByEmail).not.toHaveBeenCalled()
    expect(repository.findMembershipByIdAndBusinessId).not.toHaveBeenCalled()
    expect(repository.findServiceByIdAndBusinessId).not.toHaveBeenCalled()
    expect(repository.createService).not.toHaveBeenCalled()
    expect(repository.updateService).not.toHaveBeenCalled()
    expect(repository.deleteService).not.toHaveBeenCalled()
    expect(repository.updateBusinessAvailability).not.toHaveBeenCalled()
    expect(repository.createInvitation).not.toHaveBeenCalled()
    expect(repository.createMembership).not.toHaveBeenCalled()
    expect(repository.updateMembershipRole).not.toHaveBeenCalled()
    expect(repository.deleteMembership).not.toHaveBeenCalled()
  })

  it('bloqueia aceite de convite antes de criar membership', async () => {
    const acceptInvitation = vi.fn()
    const { repository, subscriptionService, service } = createBlockedAdminService({
      findInvitationByToken: vi.fn().mockResolvedValue({
        id: 'invitation-1',
        businessId: 'business-1',
        email: 'staff@example.com',
        role: 'STAFF',
        expiresAt: new Date('2999-01-01T00:00:00.000Z'),
        acceptedAt: null,
      }),
      acceptInvitation,
    })

    await expect(service.acceptInvitation('token-1', {})).rejects.toBe(PLAN_EXPIRED_ERROR)

    expect(subscriptionService.assertBusinessCanWrite).toHaveBeenCalledWith('business-1')
    expect(repository.findUserByEmail).not.toHaveBeenCalled()
    expect(acceptInvitation).not.toHaveBeenCalled()
  })

  it('bloqueia criação pública de appointment antes de consultar serviço ou cliente', async () => {
    const { appointmentRepository, businessRepository, subscriptionService, service } =
      createBlockedAppointmentsService()

    await expect(service.create({
      businessId: 'business-1',
      serviceId: 'service-1',
      customerName: 'Cliente',
      phone: '(48) 99999-0000',
      date: '2026-07-10',
      time: '14:00',
    })).rejects.toBe(PLAN_EXPIRED_ERROR)

    expect(subscriptionService.assertBusinessCanWrite).toHaveBeenCalledWith('business-1')
    expect(businessRepository.findServiceById).not.toHaveBeenCalled()
    expect(appointmentRepository.create).not.toHaveBeenCalled()
  })

  it.each([
    {
      name: 'alteração residual de status',
      run: (service: AppointmentsService) => service.updateStatus(
        'appointment-1',
        'business-1',
        { status: 'COMPLETED' },
      ),
    },
    {
      name: 'alteração administrativa de status',
      run: (service: AppointmentsService) => service.updateStatusForAdmin(
        'appointment-1',
        'business-1',
        { status: 'COMPLETED' },
        { userId: 'owner-1', role: 'OWNER' },
      ),
    },
    {
      name: 'atribuição de responsável',
      run: (service: AppointmentsService) => service.updateAssignee(
        'appointment-1',
        'business-1',
        { assignedToUserId: 'staff-1' },
      ),
    },
    {
      name: 'delete residual de appointment',
      run: (service: AppointmentsService) => service.delete('appointment-1', 'business-1'),
    },
  ])('bloqueia $name antes de consultar ou alterar appointment', async ({ run }) => {
    const { appointmentRepository, subscriptionService, service } =
      createBlockedAppointmentsService()

    await expect(run(service)).rejects.toBe(PLAN_EXPIRED_ERROR)

    expect(subscriptionService.assertBusinessCanWrite).toHaveBeenCalledWith('business-1')
    expect(appointmentRepository.findById).not.toHaveBeenCalled()
    expect(appointmentRepository.updateStatus).not.toHaveBeenCalled()
    expect(appointmentRepository.updateAssignee).not.toHaveBeenCalled()
    expect(appointmentRepository.delete).not.toHaveBeenCalled()
  })

  it('bloqueia cancelamento público usando o businessId encontrado pelo token', async () => {
    const { appointmentRepository, subscriptionService, service } =
      createBlockedAppointmentsService({
        appointmentsRepository: {
          findByPublicToken: vi.fn().mockResolvedValue({
            id: 'appointment-1',
            businessId: 'business-1',
            scheduledAt: new Date('2999-01-01T00:00:00.000Z'),
            status: 'SCHEDULED',
          }),
        },
      })

    await expect(service.cancelPublicAppointment({ token: 'token-1' })).rejects.toBe(
      PLAN_EXPIRED_ERROR,
    )

    expect(subscriptionService.assertBusinessCanWrite).toHaveBeenCalledWith('business-1')
    expect(appointmentRepository.updateStatus).not.toHaveBeenCalled()
  })
})
