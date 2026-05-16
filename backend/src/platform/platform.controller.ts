import { BadRequestException, Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { parsePaginationParams } from '../common/pagination'
import { PlatformAdminGuard } from '../auth/platform-admin.guard'
import { PlatformService } from './platform.service'
import { platformBusinessesQuerySchema, platformUpdateBusinessSubscriptionSchema } from './platform.schema'

@Controller('platform')
@UseGuards(PlatformAdminGuard)
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('health')
  getHealth() {
    return { ok: true as const }
  }

  @Get('businesses')
  async listBusinesses(
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    const pagination = parsePaginationParams(page ?? '1', perPage ?? '20')!

    const parseResult = platformBusinessesQuerySchema.safeParse({
      status,
      plan,
      search,
    })

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.platformService.listBusinesses(parseResult.data, pagination)
  }

  @Patch('businesses/:businessId/subscription')
  async updateBusinessSubscription(@Param('businessId') businessId: string, @Body() body: unknown) {
    const parseResult = platformUpdateBusinessSubscriptionSchema.safeParse(body)

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.platformService.updateBusinessSubscription(businessId, parseResult.data)
  }

  @Patch('businesses/:businessId/cancel-subscription')
  async cancelBusinessSubscription(@Param('businessId') businessId: string) {
    return this.platformService.cancelBusinessSubscription(businessId)
  }

  @Patch('businesses/:businessId/mark-past-due')
  async markBusinessSubscriptionAsPastDue(@Param('businessId') businessId: string) {
    return this.platformService.markBusinessSubscriptionAsPastDue(businessId)
  }
}
