import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, type UserRole } from '@/lib/db/schema'

const COOKIE_NAME = 'alanoud_session'
const SESSION_SECONDS = 60 * 60 * 24 * 7

type SessionPayload = { sub: number; iat: number; exp: number }
export type CurrentUser = { id: number; username: string; role: UserRole }

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value || value.length < 32) {
    throw new Error('AUTH_SECRET must be configured with at least 32 characters')
  }
  return value
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url')
}

function createToken(userId: number) {
  const now = Math.floor(Date.now() / 1000)
  const payload: SessionPayload = { sub: userId, iat: now, exp: now + SESSION_SECONDS }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encoded}.${sign(encoded)}`
}

function readToken(token: string): SessionPayload | null {
  const [encoded, signature, extra] = token.split('.')
  if (!encoded || !signature || extra) return null
  let expected: string
  try {
    expected = sign(encoded)
  } catch {
    return null
  }
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload
    const now = Math.floor(Date.now() / 1000)
    if (!Number.isInteger(payload.sub) || payload.sub <= 0 || !Number.isInteger(payload.exp) || payload.exp <= now) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export async function setSession(userId: number) {
  const store = await cookies()
  store.set(COOKIE_NAME, createToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_SECONDS,
  })
}

export async function clearSession() {
  const store = await cookies()
  store.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = readToken(token)
  if (!payload) return null

  const [user] = await db
    .select({ id: users.id, username: users.username, role: users.role, active: users.active })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1)

  if (!user?.active) return null
  return { id: user.id, username: user.username, role: user.role }
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireRole(role: UserRole) {
  const user = await requireUser()
  if (role === 'admin' && user.role !== 'admin') redirect('/orders')
  return user
}

export async function authorizeRole(role: UserRole): Promise<CurrentUser | null> {
  const user = await getCurrentUser()
  if (!user) return null
  if (role === 'admin' && user.role !== 'admin') return null
  return user
}

export async function userCount() {
  const rows = await db.select({ id: users.id }).from(users).limit(1)
  return rows.length
}
