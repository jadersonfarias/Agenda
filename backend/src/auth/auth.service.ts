import { Injectable } from '@nestjs/common'
import { compare } from 'bcryptjs'
import { AuthRepository } from './auth.repository'
import { AuthBusinessContext, AuthUserResponse } from './auth.schema'
import { AccessTokenService } from './access-token.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly accessTokenService: AccessTokenService,
  ) {}

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

  async listBusinessesForUser(userId: string): Promise<AuthBusinessContext[]> {
    const memberships = await this.authRepository.listBusinessesByUserId(userId)

    return memberships.map((membership: {
      role: 'OWNER' | 'ADMIN' | 'STAFF'
      business: {
        id: string
        name: string
        slug: string
      }
    }) => ({
      id: membership.business.id,
      name: membership.business.name,
      slug: membership.business.slug,
      role: membership.role,
    }))
  }

  async generateToken(userId: string, email: string): Promise<string> {
    return this.accessTokenService.generateToken(userId, email)
  }
}
