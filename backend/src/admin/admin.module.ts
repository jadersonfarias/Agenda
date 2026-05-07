import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AdminController, InvitationsController } from './admin.controller'
import { AdminService } from './admin.service'
import { AdminRepository } from './admin.repository'
import { AuthModule } from '../auth/auth.module'
import { AuthMiddleware } from '../auth/auth.middleware'
import { BusinessesModule } from '../businesses/businesses.module'

@Module({
  imports: [AuthModule, BusinessesModule],
  controllers: [AdminController, InvitationsController],
  providers: [AdminService, AdminRepository],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(AdminController)
  }
}
