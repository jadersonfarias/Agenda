import { ConflictException, Injectable } from '@nestjs/common'
import { compare, hash } from 'bcryptjs'
import { AuthRepository } from './auth.repository'
import {
  AuthBusinessContext,
  AuthUserResponse,
  RegisterBusinessOwnerDto,
  RegisterBusinessOwnerResponse,
} from './auth.schema'
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

  async registerBusinessOwner(input: RegisterBusinessOwnerDto): Promise<RegisterBusinessOwnerResponse> {
    const email = input.email.trim().toLowerCase()
    const businessSlug = input.businessSlug.trim().toLowerCase()
    const phone = input.phone?.trim() ? input.phone.trim() : null
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const [existingUser, existingBusiness] = await Promise.all([
      this.authRepository.findUserByEmail(email),
      this.authRepository.findBusinessBySlug(businessSlug),
    ])

    if (existingUser) {
      throw new ConflictException('Email já cadastrado')
    }

    if (existingBusiness) {
      throw new ConflictException('Slug já cadastrado')
    }

    const hashedPassword = await hash(input.password, 10)

    return this.authRepository.createBusinessOwner({
      ownerName: input.ownerName.trim(),
      email,
      hashedPassword,
      businessName: input.businessName.trim(),
      businessSlug,
      phone,
      plan: 'BASIC',
      subscriptionStatus: 'TRIALING',
      trialEndsAt,
    })
  }
}
