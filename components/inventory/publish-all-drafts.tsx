'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { publishAllDrafts } from '@/app/actions'
import { Button } from '@/components/ui/button'

export function PublishAllDraftsButton() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(async () => {
        const result = await publishAllDrafts()
        if (result.ok) router.refresh()
      })}
    >
      {pending ? 'جارٍ النشر...' : 'نشر جميع المسودات'}
    </Button>
  )
}
