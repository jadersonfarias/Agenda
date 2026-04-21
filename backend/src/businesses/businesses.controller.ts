import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common'
import { BusinessesService } from './businesses.service'
import { businessLookupSchema, getAvailabilityQuerySchema } from './businesses.schema'

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get(':businessId/services')
  getServices(@Param('businessId') businessId: string) {
    const parsedBusinessId = businessLookupSchema.safeParse(businessId)

    if (!parsedBusinessId.success) {
      throw new BadRequestException(parsedBusinessId.error.errors.map((error) => error.message).join(', '))
    }

    return this.businessesService.getServices(parsedBusinessId.data)
  }

  @Get(':businessId/availability')
  getAvailability(
    @Param('businessId') businessId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string
  ) {
    const parsedBusinessId = businessLookupSchema.safeParse(businessId)
    if (!parsedBusinessId.success) {
      throw new BadRequestException(parsedBusinessId.error.errors.map((error) => error.message).join(', '))
    }

    const parsedQuery = getAvailabilityQuerySchema.safeParse({ serviceId, date })
    if (!parsedQuery.success) {
      throw new BadRequestException(parsedQuery.error.errors.map((error) => error.message).join(', '))
    }

    return this.businessesService.getAvailability(parsedBusinessId.data, parsedQuery.data.serviceId, parsedQuery.data.date)
  }
}
