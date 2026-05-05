import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { AdminService } from './admin.service'
import { RoleGuard } from '../auth/role.guard'
import { Roles } from '../auth/roles.decorator'
import { parsePaginationParams } from '../common/pagination'

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
}
