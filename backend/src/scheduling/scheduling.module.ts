import { Global, Module } from '@nestjs/common'
import { AvailabilityCacheService } from './availability-cache.service'
import { TimezoneService } from './timezone.service'

@Global()
@Module({
  providers: [AvailabilityCacheService, TimezoneService],
  exports: [AvailabilityCacheService, TimezoneService],
})
export class SchedulingModule {}
