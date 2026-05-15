import { BadRequestException, Body, Controller, Post, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import {
  LoginResponse,
  RegisterBusinessOwnerResponse,
  loginSchema,
  registerBusinessOwnerSchema,
} from './auth.schema'
import { RateLimit } from '../common/rate-limit.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @RateLimit({
    key: 'auth-login',
    limit: 5,
    windowMs: 60_000,
    message: 'Muitas tentativas de login. Tente novamente em instantes.',
  })
  async login(@Body() body: unknown): Promise<LoginResponse> {
    const parseResult = loginSchema.safeParse(body)
    if (!parseResult.success) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const user = await this.authService.validateUser(parseResult.data.email, parseResult.data.password)
    if (!user) {
      throw new UnauthorizedException('Email ou senha incorretos')
    }

    const businesses = await this.authService.listBusinessesForUser(user.id)
    const accessToken = await this.authService.generateToken(user.id, user.email)

    return {
      user,
      businesses,
      currentBusinessId: businesses[0]?.id ?? null,
      accessToken,
    }
  }

  @Post('register-business-owner')
  @RateLimit({
    key: 'auth-register-business-owner',
    limit: 3,
    windowMs: 60_000,
    message: 'Muitas tentativas de cadastro. Tente novamente em instantes.',
  })
  async registerBusinessOwner(@Body() body: unknown): Promise<RegisterBusinessOwnerResponse> {
    const parseResult = registerBusinessOwnerSchema.safeParse(body)

    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((error) => error.message).join(', '))
    }

    return this.authService.registerBusinessOwner(parseResult.data)
  }
}
