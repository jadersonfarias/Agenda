import { Module } from '@nestjs/common'
import { AppointmentsController } from './appointments.controller'
import { AppointmentsService } from './appointments.service'
import { AppointmentsRepository } from './appointments.repository'
import { BusinessesModule } from '../businesses/businesses.module'

@Module({
  imports: [BusinessesModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
