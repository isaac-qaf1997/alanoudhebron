import type * as React from 'react'
import { cn } from '@/lib/utils'

export function Panel({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card p-5', className)}>
      {title ? (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-balance">{title}</h2>
            {description ? <p className="text-sm text-muted-foreground text-pretty">{description}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}
