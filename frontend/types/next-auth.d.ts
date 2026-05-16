import 'next-auth'
import 'next-auth/jwt'

type SessionBusinessContext = {
  id: string
  name: string
  slug: string
  role: 'OWNER' | 'ADMIN' | 'STAFF'
}

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    currentBusinessId?: string | null
    businesses?: SessionBusinessContext[]
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isPlatformAdmin?: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    currentBusinessId?: string | null
    businesses?: SessionBusinessContext[]
    isPlatformAdmin?: boolean
  }
}
