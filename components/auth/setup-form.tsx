'use client'

import { useActionState } from 'react'
import { setupFirstAdminAction, type AuthFormState } from '@/app/auth-actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'

const initialState: AuthFormState = {}

export function SetupForm() {
  const [state, action, pending] = useActionState(setupFirstAdminAction, initialState)
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="رمز الإعداد الأول" htmlFor="setupToken" hint="هو الرمز الذي ستضيفينه في إعدادات Vercel باسم INITIAL_SETUP_TOKEN">
        <Input id="setupToken" name="setupToken" type="password" autoComplete="off" required dir="ltr" className="text-left" />
      </Field>
      <Field label="اسم المدير" htmlFor="username" hint="3–40 حرفاً إنجليزياً أو رقماً، مثل alanoud.admin">
        <Input id="username" name="username" autoComplete="username" autoFocus required minLength={3} maxLength={40} dir="ltr" className="text-left" />
      </Field>
      <Field label="كلمة المرور" htmlFor="password" hint="10 أحرف على الأقل">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={200} dir="ltr" className="text-left" />
      </Field>
      <Field label="تأكيد كلمة المرور" htmlFor="confirmPassword">
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} maxLength={200} dir="ltr" className="text-left" />
      </Field>
      {state.error ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? 'جارٍ إنشاء الحساب…' : 'إنشاء حساب المدير'}</Button>
    </form>
  )
}
