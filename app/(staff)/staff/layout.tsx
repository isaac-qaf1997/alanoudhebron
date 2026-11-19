import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/session'
import { StaffAppShell } from '@/components/staff/staff-app-shell'

export const metadata: Metadata = {
  title: 'تطبيق العنود للموظفين',
  description: 'تطبيق العمل الداخلي لمتجر العنود',
  manifest: '/staff/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'العنود' },
}

export default async function StaffLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser()
  return <StaffAppShell user={{ username: user.username, role: user.role }}>{children}</StaffAppShell>
}
