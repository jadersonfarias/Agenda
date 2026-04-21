import { Controller, Get, Req } from '@nestjs/common'
import { AdminService } from './admin.service'

type AuthenticatedRequest = {
  user?: {
    id: string
  }
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('services')
  async listServices(@Req() request: AuthenticatedRequest) {
    return this.adminService.listServices(request.user!.id)
  }
}
