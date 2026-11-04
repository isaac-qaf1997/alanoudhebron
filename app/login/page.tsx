import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/auth-form'
import { getCurrentUser, userCount } from '@/lib/auth/session'

export const metadata = { title: 'تسجيل الدخول | العنود للزي الشرعي' }

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect(user.role === 'staff' ? '/orders' : '/')
  if ((await userCount()) === 0) redirect('/setup')

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/5 text-2xl font-bold text-primary">ع</span>
          <h1 className="text-2xl font-bold text-primary">العنود للزي الشرعي</h1>
          <p className="text-sm text-muted-foreground">سجّلي الدخول إلى لوحة التحكم</p>
        </div>
        <LoginForm />
      </section>
    </main>
  )
}
