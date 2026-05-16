import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { PlatformBusinessesSection } from '../../components/platform/PlatformBusinessesSection'
import { Card } from '../../components/ui/card'
import { authOptions } from '../../lib/auth'

export default async function AdminMasterPage() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    redirect('/login')
  }

  if (session.user.isPlatformAdmin !== true) {
    redirect('/admin')
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-3 py-4 sm:gap-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Admin master</p>
          <div className="space-y-2">
            <h1 className="text-[1.8rem] font-semibold text-slate-900 sm:text-3xl lg:text-4xl">
              Painel da plataforma
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Gerencie clientes, planos e assinaturas.
            </p>
          </div>
        </div>
      </Card>

      <PlatformBusinessesSection />
    </main>
  )
}
