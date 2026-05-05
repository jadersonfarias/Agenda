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
  adminBusinessAvailabilitySchema,
  adminBusinessIdSchema,
  adminMonthlySummaryQuerySchema,
  adminServiceSchema,
} from './admin.schema'

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

  private getBusinessId(request: AuthenticatedRequest, value?: string) {
    const businessId = value ?? request.businessId

    if (!businessId) {
      throw new BadRequestException('businessId é obrigatório')
    }

    return businessId
  }

  @Get('dashboard')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async getDashboard(@Req() request: AuthenticatedRequest, @Query('businessId') businessId?: string) {
    return this.adminService.getDashboard(this.getBusinessId(request, businessId))
  }

  @Get('financial-summary')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  async getFinancialSummary(
    @Req() request: AuthenticatedRequest,
    @Query('businessId') businessId?: string,
    @Query('month') month?: string
  ) {
    const parseResult = adminMonthlySummaryQuerySchema.safeParse({
      businessId: this.getBusinessId(request, businessId),
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
    return this.adminService.listServices(this.getBusinessId(request, businessId), pagination)
  }

  @Post('services')
  @Roles('OWNER', 'ADMIN')
  async createService(@Body() body: unknown) {
    const parseResult = adminServiceSchema.safeParse(body)

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.createService(parseResult.data)
  }

  @Patch('services/:serviceId')
  @Roles('OWNER', 'ADMIN')
  async updateService(@Param('serviceId') serviceId: string, @Body() body: unknown) {
    const parseResult = adminServiceSchema.safeParse(body)

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
      businessId: this.getBusinessId(request, businessId),
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.deleteService(serviceId, parseResult.data.businessId)
  }

  @Patch('business')
  @Roles('OWNER', 'ADMIN')
  async updateBusinessAvailability(@Body() body: unknown) {
    const parseResult = adminBusinessAvailabilitySchema.safeParse(body)

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.adminService.updateBusinessAvailability(parseResult.data)
  }
}
