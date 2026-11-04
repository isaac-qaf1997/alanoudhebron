'use server'

import { and, count, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { hashPassword } from '@/lib/auth/password'
import { authorizeRole } from '@/lib/auth/session'

export type UserActionState = { error?: string; success?: string }

function usernameValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function passwordValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : ''
}

function userIdValue(value: FormDataEntryValue | null) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export async function createManagedUserAction(
  _previous: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  if (!(await authorizeRole('admin'))) return { error: 'غير مسموح. هذه العملية للمدير فقط.' }

  const username = usernameValue(formData.get('username'))
  const password = passwordValue(formData.get('password'))
  const role = formData.get('role') === 'admin' ? 'admin' : 'staff'
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) return { error: 'اسم المستخدم يجب أن يكون 3–40 حرفاً إنجليزياً أو رقماً' }
  if (password.length < 10 || password.length > 200) return { error: 'كلمة المرور يجب أن تحتوي على 10 أحرف على الأقل' }

  try {
    const passwordHash = await hashPassword(password)
    await db.insert(users).values({ username, passwordHash, role, active: true })
    revalidatePath('/users')
    return { success: `تم إنشاء المستخدم ${username}` }
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
      return { error: 'اسم المستخدم مستخدم مسبقاً' }
    }
    console.error('[users:create]', error)
    return { error: 'تعذر إنشاء المستخدم' }
  }
}

export async function setManagedUserRoleAction(formData: FormData) {
  const current = await authorizeRole('admin')
  if (!current) return
  const targetId = userIdValue(formData.get('userId'))
  const role = formData.get('role') === 'admin' ? 'admin' : 'staff'
  if (!targetId) return
  if (targetId === current.id && role !== 'admin') return

  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(724190312)`)
    if (role !== 'admin') {
      const [activeAdmins] = await tx.select({ value: count() }).from(users).where(and(eq(users.role, 'admin'), eq(users.active, true)))
      const [target] = await tx.select({ role: users.role, active: users.active }).from(users).where(eq(users.id, targetId)).limit(1)
      if (target?.role === 'admin' && target.active && Number(activeAdmins?.value ?? 0) <= 1) return
    }
    await tx.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, targetId))
  })
  revalidatePath('/users')
}

export async function setManagedUserActiveAction(formData: FormData) {
  const current = await authorizeRole('admin')
  if (!current) return
  const targetId = userIdValue(formData.get('userId'))
  const active = formData.get('active') === 'true'
  if (!targetId || (targetId === current.id && !active)) return

  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(724190312)`)
    if (!active) {
      const [target] = await tx.select({ role: users.role, active: users.active }).from(users).where(eq(users.id, targetId)).limit(1)
      if (target?.role === 'admin' && target.active) {
        const [activeAdmins] = await tx.select({ value: count() }).from(users).where(and(eq(users.role, 'admin'), eq(users.active, true)))
        if (Number(activeAdmins?.value ?? 0) <= 1) return
      }
    }
    await tx.update(users).set({ active, updatedAt: new Date() }).where(eq(users.id, targetId))
  })
  revalidatePath('/users')
}

export async function resetManagedUserPasswordAction(formData: FormData) {
  const current = await authorizeRole('admin')
  if (!current) return
  const targetId = userIdValue(formData.get('userId'))
  const password = passwordValue(formData.get('password'))
  if (!targetId || password.length < 10 || password.length > 200) return
  const passwordHash = await hashPassword(password)
  await db.update(users).set({ passwordHash, failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() }).where(eq(users.id, targetId))
  revalidatePath('/users')
}
