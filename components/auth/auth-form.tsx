'use client'

import { useActionState } from 'react'
import { loginAction, type AuthFormState } from '@/app/auth-actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'

const initialState: AuthFormState = {}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState)
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="اسم المستخدم" htmlFor="username">
        <Input id="username" name="username" autoComplete="username" autoFocus required dir="ltr" className="text-left" />
      </Field>
      <Field label="كلمة المرور" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required dir="ltr" className="text-left" />
      </Field>
      {state.error ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}</Button>
    </form>
  )
}
