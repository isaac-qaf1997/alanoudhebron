'use client'

import { useState, useTransition } from 'react'
import { saveCourierIntegrationSettings } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import type { CourierPublic } from '@/lib/db/schema'

export function CourierIntegrationSettings({ courier }: { courier: CourierPublic }) {
  const [pending, startTransition] = useTransition()
  const [baseUrl, setBaseUrl] = useState(courier.apiBaseUrl ?? '')
  const [apiKey, setApiKey] = useState('')
  const [secretToken, setSecretToken] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [enabled, setEnabled] = useState(courier.apiEnabled)
  const [sendOnOrderCreate, setSendOnOrderCreate] = useState(courier.sendOnOrderCreate)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const result = await saveCourierIntegrationSettings(courier.id, {
        baseUrl,
        apiKey,
        secretToken,
        enabled,
        sendOnOrderCreate,
        adminPassword,
      })
      if (!result.ok) {
        setFeedback({ type: 'error', text: result.error })
        return
      }
      setApiKey('')
      setSecretToken('')
      setAdminPassword('')
      setFeedback({ type: 'success', text: 'تم حفظ إعدادات الربط بشكل مشفّر.' })
    })
  }

  return (
    <details className="mt-3 rounded-lg border border-border bg-background/30 p-3">
      <summary className="cursor-pointer text-sm font-semibold">
        إعدادات API {courier.apiEnabled ? '· مفعّل' : '· غير مفعّل'}
      </summary>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
        <p className="text-xs leading-6 text-muted-foreground">
          أدخلي بيانات الربط التي زودتك بها شركة التوصيل. المفاتيح القديمة لا تظهر هنا؛ اتركي حقولها فارغة للاحتفاظ بها.
        </p>
        <Field label="Base URL" htmlFor={`courier-${courier.id}-base-url`}>
          <Input
            id={`courier-${courier.id}-base-url`}
            type="url"
            dir="ltr"
            placeholder="https://api.carrier.example/v1"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            required={enabled}
          />
        </Field>
        <Field
          label={courier.hasApiKey ? 'API Key (اتركيه فارغاً للإبقاء على المفتاح الحالي)' : 'API Key'}
          htmlFor={`courier-${courier.id}-api-key`}
        >
          <Input
            id={`courier-${courier.id}-api-key`}
            type="password"
            dir="ltr"
            autoComplete="new-password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            required={enabled && !courier.hasApiKey}
          />
        </Field>
        <Field
          label={courier.hasSecretToken ? 'Secret Token (اتركيه فارغاً للإبقاء على الرمز الحالي)' : 'Secret Token'}
          htmlFor={`courier-${courier.id}-secret-token`}
        >
          <Input
            id={`courier-${courier.id}-secret-token`}
            type="password"
            dir="ltr"
            autoComplete="new-password"
            value={secretToken}
            onChange={(event) => setSecretToken(event.target.value)}
            required={enabled && !courier.hasSecretToken}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-primary" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          تفعيل الإرسال والاستقبال لهذه الشركة
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={sendOnOrderCreate}
            onChange={(event) => setSendOnOrderCreate(event.target.checked)}
            disabled={!enabled}
          />
          أرسل الطلب مباشرة عند إنشائه (بدلاً من انتظار تحويله إلى قيد التوصيل)
        </label>
        <Field label="رمز إدارة إعدادات الربط" htmlFor={`courier-${courier.id}-admin-password`}>
          <Input
            id={`courier-${courier.id}-admin-password`}
            type="password"
            dir="ltr"
            autoComplete="current-password"
            value={adminPassword}
            onChange={(event) => setAdminPassword(event.target.value)}
            required
          />
        </Field>
        {feedback ? (
          <p
            role={feedback.type === 'error' ? 'alert' : 'status'}
            className={feedback.type === 'error' ? 'text-sm text-destructive' : 'text-sm text-success'}
          >
            {feedback.text}
          </p>
        ) : null}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'جارٍ الحفظ...' : 'حفظ إعدادات API'}
        </Button>
      </form>
    </details>
  )
}
