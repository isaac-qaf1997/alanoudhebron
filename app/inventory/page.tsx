import type { Metadata } from 'next'
import { ModelCard } from '@/components/inventory/model-card'
import { ModelForm } from '@/components/inventory/model-form'
import { EmptyState, Panel } from '@/components/ui/panel'
import { getModels } from '@/lib/queries'

export const metadata: Metadata = { title: 'المخزون والموديلات | العنود للزي الشرعي' }

export default async function InventoryPage() {
  const models = await getModels()
  const pieces = models.reduce((s, m) => s + m.colors.reduce((cs, c) => cs + c.stock, 0), 0)

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
      <ModelForm />
      <Panel title="الموديلات" description={`${models.length} موديل · ${pieces} قطعة متوفرة`}>
        {models.length === 0 ? (
          <EmptyState>لا توجد موديلات بعد. أضيفي أول موديل مع ألوانه وكمياته.</EmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {models.map((model) => (
              <li key={model.id}>
                <ModelCard model={model} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
