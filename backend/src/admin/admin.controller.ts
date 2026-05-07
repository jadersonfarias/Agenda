import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AdminService } from './admin.service'
import { RoleGuard } from '../auth/role.guard'
import { Roles } from '../auth/roles.decorator'
import { parsePaginationParams } from '../common/pagination'
import {
  acceptInvitationSchema,
  adminAppointmentsQuerySchema,
  adminBusinessAvailabilitySchema,
  adminBusinessIdSchema,
  adminCreateInvitationSchema,
  adminCreateMembershipSchema,
  adminMembershipRoleSchema,
  adminMonthlySummaryQuerySchema,
  adminServiceSchema,
} from './admin.schema'
import { updateAppointmentStatusSchema } from '../appointments/appointment.schema'

type AuthenticatedRequest = {
  businessId?: string
  user?: {
    id: string
    memberships: Array<{
      businessId: string
    }>
  }
}

@Controller('admin')
@UseGuards(RoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private async getBusinessId(request: AuthenticatedRequest, value?: string) {
    const businessId = value ?? request.businessId

    if (!businessId) {
      if (!request.user?.id) {
        throw new BadRequestException('businessId é obrigatório')
      }

      return this.adminService.getDefaultBusinessIdForUser(request.user.id)
    }

    return businessId
  }

  @Get('dashboard')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async getDashboard(@Req() request: AuthenticatedRequest, @Query('businessId') businessId?: string) {
    return this.adminService.getDashboard(await this.getBusinessId(request, businessId))
  }

  @Get('financial-summary')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async getFinancialSummary(
    @Req() request: AuthenticatedRequest,
    @Query('businessId') businessId?: string,
    @Query('month') month?: string
  ) {
    const parseResult = adminMonthlySummaryQuerySchema.safeParse({
      businessId: await this.getBusinessId(request, businessId),
      month,
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.getMonthlySummary(parseResult.data.businessId, parseResult.data.month)
  }

  @Get('services')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async listServices(
    @Req() request: AuthenticatedRequest,
    @Query('businessId') businessId?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string
  ) {
    const pagination = parsePaginationParams(page, perPage)
    return this.adminService.listServices(await this.getBusinessId(request, businessId), pagination)
  }

  @Get('memberships')
  @Roles('OWNER', 'ADMIN')
  async listMemberships(
    @Req() request: AuthenticatedRequest,
    @Query('businessId') businessId?: string
  ) {
    return this.adminService.listMemberships(await this.getBusinessId(request, businessId))
  }

  @Get('invitations')
  @Roles('OWNER', 'ADMIN')
  async listInvitations(
    @Req() request: AuthenticatedRequest,
    @Query('businessId') businessId?: string
  ) {
    return this.adminService.listInvitations(await this.getBusinessId(request, businessId))
  }

  @Post('invitations')
  @Roles('OWNER')
  async createInvitation(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const rawBody = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {}
    const parseResult = adminCreateInvitationSchema.safeParse({
      ...rawBody,
      businessId: await this.getBusinessId(
        request,
        typeof rawBody.businessId === 'string' ? rawBody.businessId : undefined
      ),
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.createInvitation(parseResult.data)
  }

  @Post('memberships')
  @Roles('OWNER')
  async createMembership(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const rawBody = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {}
    const parseResult = adminCreateMembershipSchema.safeParse({
      ...rawBody,
      businessId: await this.getBusinessId(
        request,
        typeof rawBody.businessId === 'string' ? rawBody.businessId : undefined
      ),
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.createMembership(parseResult.data)
  }

  @Patch('memberships/:id')
  @Roles('OWNER', 'ADMIN')
  async updateMembershipRole(
    @Req() request: AuthenticatedRequest,
    @Param('id') membershipId: string,
    @Body() body: unknown
  ) {
    const rawBody = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {}
    const parseResult = adminMembershipRoleSchema.safeParse({
      ...rawBody,
      businessId: await this.getBusinessId(
        request,
        typeof rawBody.businessId === 'string' ? rawBody.businessId : undefined
      ),
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.updateMembershipRole(membershipId, parseResult.data)
  }

  @Delete('memberships/:id')
  @Roles('OWNER', 'ADMIN')
  async deleteMembership(
    @Req() request: AuthenticatedRequest,
    @Param('id') membershipId: string,
    @Query('businessId') businessId?: string
  ) {
    const parseResult = adminBusinessIdSchema.safeParse({
      businessId: await this.getBusinessId(request, businessId),
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.deleteMembership(membershipId, parseResult.data.businessId)
  }

  @Get('appointments')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async listAppointments(
    @Req() request: AuthenticatedRequest,
    @Query('businessId') businessId?: string,
    @Query('statusFilter') statusFilter?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string
  ) {
    const parseResult = adminAppointmentsQuerySchema.safeParse({
      businessId: await this.getBusinessId(request, businessId),
      statusFilter,
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    const pagination = parsePaginationParams(page, perPage)

    return this.adminService.listAppointments(
      parseResult.data.businessId,
      parseResult.data.statusFilter ?? 'all',
      pagination
    )
  }

  @Post('services')
  @Roles('OWNER', 'ADMIN')
  async createService(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const rawBody = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {}
    const parseResult = adminServiceSchema.safeParse({
      ...rawBody,
      businessId: await this.getBusinessId(
        request,
        typeof rawBody.businessId === 'string' ? rawBody.businessId : undefined
      ),
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.createService(parseResult.data)
  }

  @Patch('services/:serviceId')
  @Roles('OWNER', 'ADMIN')
  async updateService(
    @Req() request: AuthenticatedRequest,
    @Param('serviceId') serviceId: string,
    @Body() body: unknown
  ) {
    const rawBody = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {}
    const parseResult = adminServiceSchema.safeParse({
      ...rawBody,
      businessId: await this.getBusinessId(
        request,
        typeof rawBody.businessId === 'string' ? rawBody.businessId : undefined
      ),
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.updateService(serviceId, parseResult.data)
  }

  @Delete('services/:serviceId')
  @Roles('OWNER')
  async deleteService(
    @Req() request: AuthenticatedRequest,
    @Param('serviceId') serviceId: string,
    @Query('businessId') businessId?: string
  ) {
    const parseResult = adminBusinessIdSchema.safeParse({
      businessId: await this.getBusinessId(request, businessId),
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.deleteService(serviceId, parseResult.data.businessId)
  }

  @Patch('appointments/:id/status')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async updateAppointmentStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id') appointmentId: string,
    @Query('businessId') businessId: string | undefined,
    @Body() body: unknown
  ) {
    const businessParseResult = adminBusinessIdSchema.safeParse({
      businessId: await this.getBusinessId(request, businessId),
    })

    if (!businessParseResult.success) {
      throw new BadRequestException(businessParseResult.error.errors.map((error) => error.message).join(', '))
    }

    const statusParseResult = updateAppointmentStatusSchema.safeParse(body)

    if (!statusParseResult.success) {
      throw new BadRequestException(statusParseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.updateAppointmentStatus(
      appointmentId,
      businessParseResult.data.businessId,
      statusParseResult.data
    )
  }

  @Patch('business/availability')
  @Roles('OWNER', 'ADMIN')
  async updateBusinessAvailability(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const rawBody = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {}
    const parseResult = adminBusinessAvailabilitySchema.safeParse({
      ...rawBody,
      businessId: await this.getBusinessId(
        request,
        typeof rawBody.businessId === 'string' ? rawBody.businessId : undefined
      ),
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.updateBusinessAvailability(parseResult.data)
  }
}

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly adminService: AdminService) {}

  @Get(':token')
  async getInvitation(@Param('token') token: string) {
    return this.adminService.getInvitationDetails(token)
  }

  @Post(':token/accept')
  async acceptInvitation(@Param('token') token: string, @Body() body: unknown) {
    const parseResult = acceptInvitationSchema.safeParse(body)

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.acceptInvitation(token, parseResult.data)
  }
}
