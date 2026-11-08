import { AppHeader } from '@/components/app-header'
import { requireUser } from '@/lib/auth/session'
import { getActiveCourierCount } from '@/lib/queries'

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser()
  const activeCouriers = user.role === 'admin' ? await getActiveCourierCount() : 0

  return (
    <>
      <AppHeader user={user} activeCouriers={activeCouriers} />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">{children}</main>
    </>
  )
}
