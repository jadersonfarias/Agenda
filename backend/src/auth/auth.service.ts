import { Injectable } from '@nestjs/common'
import { compare } from 'bcryptjs'
import { AuthRepository } from './auth.repository'
import { AuthUserResponse } from './auth.schema'

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async validateUser(email: string, password: string): Promise<AuthUserResponse | null> {
    const user = await this.authRepository.findUserByEmail(email)
    if (!user) {
      return null
    }

    const isValid = await compare(password, user.password)
    if (!isValid) {
      return null
    }

    return { id: user.id, name: user.name, email: user.email }
  }
}
