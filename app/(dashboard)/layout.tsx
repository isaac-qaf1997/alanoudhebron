import { AppHeader } from '@/components/app-header'
import { MobileAdminNav } from '@/components/app/mobile-admin-nav'
import { InstallAdminApp } from '@/components/app/install-admin-app'
import { requireUser } from '@/lib/auth/session'
import { getActiveCourierCount } from '@/lib/queries'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/staff')
  const activeCouriers = await getActiveCourierCount()

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <InstallAdminApp />
      <AppHeader user={user} activeCouriers={activeCouriers} />
      <main className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 md:py-6">{children}</main>
      <MobileAdminNav />
    </div>
  )
}
