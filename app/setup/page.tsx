import { redirect } from 'next/navigation'
import { SetupForm } from '@/components/auth/setup-form'
import { getCurrentUser, userCount } from '@/lib/auth/session'

export const metadata = { title: 'إعداد المدير الأول | العنود للزي الشرعي' }

export default async function SetupPage() {
  const current = await getCurrentUser()
  if (current) redirect(current.role === 'admin' ? '/admin' : '/orders')
  if ((await userCount()) > 0) redirect('/login')

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/5 text-2xl font-bold text-primary">ع</span>
          <h1 className="text-2xl font-bold text-primary">الإعداد الأول للنظام</h1>
          <p className="text-sm leading-6 text-muted-foreground">أنشئي حساب المدير الأول. هذه الصفحة تُغلق تلقائياً بعد إنشاء أول مستخدم.</p>
        </div>
        <SetupForm />
      </section>
    </main>
  )
}
