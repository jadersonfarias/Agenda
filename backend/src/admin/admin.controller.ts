import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { AdminService } from './admin.service'
import { RoleGuard } from '../auth/role.guard'
import { Roles } from '../auth/roles.decorator'
import { parsePaginationParams } from '../common/pagination'
import { updateAppointmentStatusSchema } from '../appointments/appointment.schema'
import {
  acceptInvitationSchema,
  adminBusinessAvailabilitySchema,
  adminCreateInvitationSchema,
  adminCreateMembershipSchema,
  adminMembershipRoleSchema,
  adminServiceSchema,
} from './admin.schema'

type AuthenticatedRequest = {
  businessId?: string
  user?: {
    id: string
  }
}

@Controller('admin')
@UseGuards(RoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async getDashboard(@Req() request: AuthenticatedRequest) {
    return this.adminService.getDashboard(request.businessId!)
  }

  @Get('services')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async listServices(
    @Req() request: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string
  ) {
    const pagination = parsePaginationParams(page, perPage)
    return this.adminService.listServices(request.businessId!, pagination)
  }

  @Post('services')
  @Roles('OWNER', 'ADMIN')
  async createService(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const parseResult = adminServiceSchema.safeParse({
      ...(typeof body === 'object' && body !== null ? body : {}),
      businessId: request.businessId,
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.createService(request.businessId!, parseResult.data)
  }

  @Patch('services/:id')
  @Roles('OWNER', 'ADMIN')
  async updateService(@Param('id') id: string, @Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const parseResult = adminServiceSchema.safeParse({
      ...(typeof body === 'object' && body !== null ? body : {}),
      businessId: request.businessId,
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.updateService(id, request.businessId!, parseResult.data)
  }

  @Delete('services/:id')
  @Roles('OWNER', 'ADMIN')
  async deleteService(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.adminService.deleteService(id, request.businessId!)
  }

  @Patch('business/availability')
  @Roles('OWNER', 'ADMIN')
  async updateBusinessAvailability(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const parseResult = adminBusinessAvailabilitySchema.safeParse({
      ...(typeof body === 'object' && body !== null ? body : {}),
      businessId: request.businessId,
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.updateBusinessAvailability(request.businessId!, parseResult.data)
  }

  @Get('memberships')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async listMemberships(@Req() request: AuthenticatedRequest) {
    return this.adminService.listMemberships(request.businessId!)
  }

  @Post('memberships')
  @Roles('OWNER')
  async createMembership(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const parseResult = adminCreateMembershipSchema.safeParse({
      ...(typeof body === 'object' && body !== null ? body : {}),
      businessId: request.businessId,
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.createMembership(request.businessId!, parseResult.data)
  }

  @Patch('memberships/:id')
  @Roles('OWNER')
  async updateMembershipRole(@Param('id') id: string, @Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const parseResult = adminMembershipRoleSchema.safeParse({
      ...(typeof body === 'object' && body !== null ? body : {}),
      businessId: request.businessId,
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.updateMembershipRole(id, request.businessId!, parseResult.data)
  }

  @Delete('memberships/:id')
  @Roles('OWNER')
  async deleteMembership(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.adminService.deleteMembership(id, request.businessId!)
  }

  @Get('invitations')
  @Roles('OWNER')
  async listInvitations(@Req() request: AuthenticatedRequest) {
    return this.adminService.listInvitations(request.businessId!)
  }

  @Post('invitations')
  @Roles('OWNER')
  async createInvitation(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const parseResult = adminCreateInvitationSchema.safeParse({
      ...(typeof body === 'object' && body !== null ? body : {}),
      businessId: request.businessId,
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.createInvitation(request.businessId!, parseResult.data)
  }

  @Get('appointments')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async listAppointments(
    @Req() request: AuthenticatedRequest,
    @Query('statusFilter') statusFilter?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string
  ) {
    const allowedFilters = ['active', 'completed', 'all'] as const
    const parsedFilter = statusFilter === undefined ? 'all' : (statusFilter as typeof allowedFilters[number])

    if (statusFilter !== undefined && !allowedFilters.includes(parsedFilter)) {
      throw new BadRequestException('statusFilter inválido')
    }

    const pagination = parsePaginationParams(page, perPage)
    return this.adminService.listAppointments(request.businessId!, parsedFilter, pagination)
  }

  @Patch('appointments/:id/status')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async updateAppointmentStatus(@Param('id') id: string, @Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const parseResult = updateAppointmentStatusSchema.safeParse(body)

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.updateAppointmentStatus(id, request.businessId!, parseResult.data)
  }

  @Get('financial-summary')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async getMonthlySummary(@Req() request: AuthenticatedRequest, @Query('month') month?: string) {
    return this.adminService.getMonthlySummary(request.businessId!, month)
  }

  @Get('reports/financial')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async getFinancialReport(@Req() request: AuthenticatedRequest, @Query('month') month?: string) {
    return this.adminService.getFinancialReport(request.businessId!, month)
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
