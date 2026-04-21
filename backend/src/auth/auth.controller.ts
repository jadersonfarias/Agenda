import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthUserResponse, loginSchema } from './auth.schema'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: unknown): Promise<AuthUserResponse> {
    const parseResult = loginSchema.safeParse(body)
    if (!parseResult.success) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const user = await this.authService.validateUser(parseResult.data.email, parseResult.data.password)
    if (!user) {
      throw new UnauthorizedException('Email ou senha incorretos')
    }

    return user
  }
}
