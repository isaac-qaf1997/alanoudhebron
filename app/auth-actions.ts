'use server'

import { timingSafeEqual } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { clearSession, setSession } from '@/lib/auth/session'

export type AuthFormState = { error?: string }

function cleanUsername(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function validUsername(value: string) {
  return /^[a-z0-9._-]{3,40}$/.test(value)
}

function validPassword(value: string) {
  return value.length >= 10 && value.length <= 200
}

function safeTokenMatch(candidate: string, expected: string) {
  const candidateBuffer = Buffer.from(candidate)
  const expectedBuffer = Buffer.from(expected)
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer)
}

export async function loginAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const username = cleanUsername(formData.get('username'))
  const password = String(formData.get('password') ?? '')
  if (!username || !password) return { error: 'أدخلي اسم المستخدم وكلمة المرور' }

  let destination = '/admin' 
  try {
    const [user] = await db.select().from(users).where(sql`lower(${users.username}) = ${username}`).limit(1)
    if (!user || !user.active) return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
    const now = new Date()
    if (user.lockedUntil && user.lockedUntil > now) return { error: 'تم إيقاف محاولات الدخول مؤقتاً. حاولي بعد 15 دقيقة.' }
    const matches = await verifyPassword(password, user.passwordHash)
    if (!matches) {
      await db.update(users).set({
        failedLoginAttempts: sql`CASE WHEN ${users.failedLoginAttempts} + 1 >= 5 THEN 0 ELSE ${users.failedLoginAttempts} + 1 END`,
        lockedUntil: sql`CASE WHEN ${users.failedLoginAttempts} + 1 >= 5 THEN NOW() + INTERVAL '15 minutes' ELSE NULL END`,
      }).where(eq(users.id, user.id))
      return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
    }
    destination = user.role === 'staff' ? '/orders' : '/admin'
    await db.update(users).set({ lastLoginAt: now, failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, user.id))
    await setSession(user.id)
  } catch (error) {
    console.error('[auth:login]', error)
    return { error: 'تعذر تسجيل الدخول. تأكدي من إعداد AUTH_SECRET وتشغيل تحديث قاعدة البيانات.' }
  }

  redirect(destination)
}

export async function setupFirstAdminAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = cleanUsername(formData.get('username'))
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirmPassword') ?? '')
  const setupToken = String(formData.get('setupToken') ?? '')
  const expectedSetupToken = process.env.INITIAL_SETUP_TOKEN

  if (!expectedSetupToken || !safeTokenMatch(setupToken, expectedSetupToken)) return { error: 'رمز الإعداد الأول غير صحيح. أضيفي INITIAL_SETUP_TOKEN إلى إعدادات Vercel وأدخليه هنا.' }
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) return { error: 'أضيفي AUTH_SECRET في إعدادات Vercel أولاً (32 حرفاً على الأقل).' }
  if (!validUsername(username)) return { error: 'اسم المستخدم يجب أن يكون 3–40 حرفاً إنجليزياً أو رقماً، ويمكن استخدام . _ -' }
  if (!validPassword(password)) return { error: 'كلمة المرور يجب أن تحتوي على 10 أحرف على الأقل' }
  if (password !== confirm) return { error: 'كلمتا المرور غير متطابقتين' }

  try {
    const passwordHash = await hashPassword(password)
    const userId = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(724190311)`)
      const existing = await tx.select({ id: users.id }).from(users).limit(1)
      if (existing.length) throw new Error('SETUP_ALREADY_COMPLETED')
      const [created] = await tx
        .insert(users)
        .values({ username, passwordHash, role: 'admin', active: true })
        .returning({ id: users.id })
      return created.id
    })
    await setSession(userId)
  } catch (error) {
    if (error instanceof Error && error.message === 'SETUP_ALREADY_COMPLETED') {
      return { error: 'تم إعداد المدير مسبقاً. سجّلي الدخول من صفحة الدخول.' }
    }
    console.error('[auth:first-admin]', error)
    return { error: 'تعذر إنشاء حساب المدير. تأكدي من تحديث قاعدة البيانات وإضافة AUTH_SECRET في Vercel.' }
  }

  redirect('/admin')
}

export async function logoutAction() {
  await clearSession()
  redirect('/login')
}

