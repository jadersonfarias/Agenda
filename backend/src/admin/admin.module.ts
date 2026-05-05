import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { AdminRepository } from './admin.repository'
import { AuthModule } from '../auth/auth.module'
import { AuthMiddleware } from '../auth/auth.middleware'
import { BusinessesModule } from '../businesses/businesses.module'

@Module({
  imports: [AuthModule, BusinessesModule],
  controllers: [AdminController],// controlador para lidar com as rotas de admin
  providers: [AdminService, AdminRepository], // serviço para lógica de negócios e repositório para acesso ao banco de dados
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) { // configura o middleware de autenticação para as rotas de admin
    consumer.apply(AuthMiddleware).forRoutes(AdminController) // aplica o middleware de autenticação para todas as rotas definidas no AdminController
  }
}
