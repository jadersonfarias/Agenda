import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { AppointmentsModule } from './appointments/appointments.module'
import { BusinessesModule } from './businesses/businesses.module'
import { AuthModule } from './auth/auth.module'
import { SchedulingModule } from './scheduling/scheduling.module'
import { AdminModule } from './admin/admin.module'

@Module({
  imports: [PrismaModule, SchedulingModule, AppointmentsModule, BusinessesModule, AuthModule, AdminModule],
})
export class AppModule {}
