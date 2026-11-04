import { desc } from 'drizzle-orm'
import type { Metadata } from 'next'
import { UserManager } from '@/components/users/user-manager'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export const metadata: Metadata = { title: 'إدارة المستخدمين | العنود للزي الشرعي' }

export default async function UsersPage() {
  const current = await requireRole('admin')
  const rows = await db
    .select({ id: users.id, username: users.username, role: users.role, active: users.active, createdAt: users.createdAt, lastLoginAt: users.lastLoginAt })
    .from(users)
    .orderBy(desc(users.createdAt))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">إدارة المستخدمين والصلاحيات</h1>
        <p className="mt-1 text-sm text-muted-foreground">أنشئي حسابات الموظفين، وحددي الصفحات التي يستطيع كل مستخدم الوصول إليها.</p>
      </div>
      <UserManager users={rows} currentUserId={current.id} />
    </div>
  )
}
