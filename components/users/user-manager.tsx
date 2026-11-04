'use client'

import { useActionState } from 'react'
import { createManagedUserAction, resetManagedUserPasswordAction, setManagedUserActiveAction, setManagedUserRoleAction, type UserActionState } from '@/app/user-actions'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'

type ManagedUser = { id: number; username: string; role: 'admin' | 'staff'; active: boolean; createdAt: Date; lastLoginAt: Date | null }
const initialState: UserActionState = {}

export function UserManager({ users, currentUserId }: { users: ManagedUser[]; currentUserId: number }) {
  const [state, action, pending] = useActionState(createManagedUserAction, initialState)

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-1 text-lg font-semibold">إضافة مستخدم جديد</h2>
        <p className="mb-4 text-sm text-muted-foreground">أنشئي حساباً لموظف أو مدير آخر. كلمة المرور لا تُعرض بعد الحفظ.</p>
        <form action={action} className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
          <Field label="اسم المستخدم" htmlFor="new-username">
            <Input id="new-username" name="username" required minLength={3} maxLength={40} autoComplete="off" dir="ltr" className="text-left" placeholder="employee01" />
          </Field>
          <Field label="كلمة المرور" htmlFor="new-password" hint="10 أحرف على الأقل">
            <Input id="new-password" name="password" type="password" required minLength={10} maxLength={200} autoComplete="new-password" dir="ltr" className="text-left" />
          </Field>
          <Field label="الصلاحية" htmlFor="new-role">
            <Select id="new-role" name="role" defaultValue="staff">
              <option value="staff">موظف</option>
              <option value="admin">مدير</option>
            </Select>
          </Field>
          <Button type="submit" disabled={pending}>{pending ? 'جارٍ الإنشاء…' : 'إنشاء المستخدم'}</Button>
        </form>
        {state.error ? <p role="alert" className="mt-3 text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p role="status" className="mt-3 text-sm text-success">{state.success}</p> : null}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-1 text-lg font-semibold">المستخدمون الحاليون ({users.length})</h2>
        <p className="mb-4 text-xs text-muted-foreground">لا يمكن إيقاف أو تخفيض صلاحية آخر مدير نشط حتى لا يُغلق الوصول الإداري إلى النظام.</p>
        {users.length === 0 ? <p className="text-sm text-muted-foreground">لا يوجد مستخدمون.</p> : (
          <ul className="flex flex-col gap-3">
            {users.map((user) => (
              <li key={user.id} className="rounded-xl border border-border bg-background/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold" dir="ltr">{user.username} {user.id === currentUserId ? <span className="text-xs text-primary">(أنتِ)</span> : null}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {user.role === 'admin' ? 'مدير — صلاحية كاملة' : 'موظف — الطلبات وكشف التوصيل'}
                      {' · '}{user.active ? 'نشط' : 'موقوف'}
                      {' · آخر دخول: '}{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ar') : 'لم يسجل الدخول بعد'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.role !== 'admin' ? (
                      <form action={setManagedUserRoleAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value="admin" />
                        <Button type="submit" size="sm" variant="outline">جعله مديراً</Button>
                      </form>
                    ) : user.id !== currentUserId ? (
                      <form action={setManagedUserRoleAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value="staff" />
                        <Button type="submit" size="sm" variant="outline">تحويل لموظف</Button>
                      </form>
                    ) : null}
                    {user.id !== currentUserId ? (
                      <form action={setManagedUserActiveAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="active" value={String(!user.active)} />
                        <Button type="submit" size="sm" variant={user.active ? 'destructive' : 'outline'}>{user.active ? 'إيقاف الحساب' : 'تفعيل الحساب'}</Button>
                      </form>
                    ) : null}
                  </div>
                </div>
                <details className="mt-3 border-t border-border pt-3">
                  <summary className="cursor-pointer text-sm text-muted-foreground">إعادة تعيين كلمة المرور</summary>
                  <form action={resetManagedUserPasswordAction} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <Field label="كلمة مرور جديدة" htmlFor={`reset-${user.id}`} hint="10 أحرف على الأقل">
                      <Input id={`reset-${user.id}`} name="password" type="password" required minLength={10} maxLength={200} autoComplete="new-password" dir="ltr" className="text-left" />
                    </Field>
                    <Button size="sm" type="submit" variant="outline">حفظ كلمة المرور الجديدة</Button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
