import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { AdminRepository } from './admin.repository'
import { AuthModule } from '../auth/auth.module'
import { AuthMiddleware } from '../auth/auth.middleware'

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(AdminController)
  }
}
