import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common'
import { BusinessesService } from './businesses.service'
import { businessLookupSchema, getAvailabilityQuerySchema } from './businesses.schema'
import { parsePaginationParams } from '../common/pagination'

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get(':businessId')
  getPublicBusiness(@Param('businessId') businessId: string) {
    const parsedBusinessId = businessLookupSchema.safeParse(businessId)

    if (!parsedBusinessId.success) {
      throw new BadRequestException(parsedBusinessId.error.errors.map((error) => error.message).join(', '))
    }

    return this.businessesService.getPublicBusiness(parsedBusinessId.data)
  }

  @Get('slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    const parsedSlug = businessLookupSchema.safeParse(slug)

    if (!parsedSlug.success) {
      throw new BadRequestException(parsedSlug.error.errors.map((error) => error.message).join(', '))
    }

    return this.businessesService.getPublicBusinessBySlug(parsedSlug.data)
  }

  @Get(':businessId/services')
  getServices(
    @Param('businessId') businessId: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string
  ) {
    const parsedBusinessId = businessLookupSchema.safeParse(businessId)

    if (!parsedBusinessId.success) {
      throw new BadRequestException(parsedBusinessId.error.errors.map((error) => error.message).join(', '))
    }

    const pagination = parsePaginationParams(page, perPage)

    return this.businessesService.getServices(parsedBusinessId.data, pagination)
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
