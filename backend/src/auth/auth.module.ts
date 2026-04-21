import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuthRepository } from './auth.repository'
import { AccessTokenService } from './access-token.service'

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AccessTokenService],
  exports: [AuthService, AccessTokenService],
})
export class AuthModule {}
