import CredentialsProvider from 'next-auth/providers/credentials'
import { NextAuthOptions } from 'next-auth'

const backendAuthBaseUrl =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://127.0.0.1:3333'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Email e senha',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null
        }

        let response: Response

        try {
          response = await fetch(`${backendAuthBaseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          })
        } catch {
          throw new Error('Backend de autenticação indisponível')
        }

        if (!response.ok) {
          throw new Error('Email ou senha incorretos')
        }

        const data = await response.json()
        return {
          ...data.user,
          accessToken: data.accessToken,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id
        token.accessToken = (user as any).accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub as string
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken as string
      }
      return session
    },
  },
}

