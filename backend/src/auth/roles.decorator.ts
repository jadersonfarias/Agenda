import { SetMetadata } from '@nestjs/common'
import { MembershipRole } from './role.types'

export const ROLES_KEY = 'roles'

export const Roles = (...roles: MembershipRole[]) => SetMetadata(ROLES_KEY, roles)
