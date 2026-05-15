import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { PrismaModule } from './prisma/prisma.module'
import { AppointmentsModule } from './appointments/appointments.module'
import { BusinessesModule } from './businesses/businesses.module'
import { AuthModule } from './auth/auth.module'
import { SchedulingModule } from './scheduling/scheduling.module'
import { AdminModule } from './admin/admin.module'
import { SimpleRateLimitGuard } from './common/simple-rate-limit.guard'
import { SimpleRateLimitService } from './common/simple-rate-limit.service'

@Module({
  imports: [PrismaModule, SchedulingModule, AppointmentsModule, BusinessesModule, AuthModule, AdminModule],
  providers: [
    SimpleRateLimitService,
    {
      provide: APP_GUARD,
      useClass: SimpleRateLimitGuard,
    },
  ],
})
export class AppModule {}
