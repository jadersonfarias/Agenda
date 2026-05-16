import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtModule } from '@nestjs/jwt'
import { AuthRepository } from './auth.repository'
import { AccessTokenService } from './access-token.service'
import { RoleGuard } from './role.guard'
import { PlatformAdminGuard } from './platform-admin.guard'

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        algorithm: 'HS256',
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AccessTokenService, RoleGuard, PlatformAdminGuard],
  exports: [AuthService, AccessTokenService, RoleGuard, PlatformAdminGuard],
})
export class AuthModule {}
