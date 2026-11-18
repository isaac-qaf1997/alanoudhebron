'use client'

import { useEffect, useState } from 'react'
import { Download, Share, Smartphone, X } from 'lucide-react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function InstallAdminApp() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/admin-app-sw.js', { scope: '/' }).catch((error) => {
        console.error('[alanoud-admin:pwa]', error)
      })
    }

    const ua = window.navigator.userAgent
    setIsIos(/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone))

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  async function install() {
    if (!installPrompt) {
      setShowHelp((value) => !value)
      return
    }
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstallPrompt(null)
  }

  if (isStandalone) return null

  return (
    <section className="mx-auto mt-3 flex max-w-7xl flex-col gap-2 px-4 md:px-6" aria-label="تثبيت تطبيق الإدارة">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d8c7a8] bg-[#fbf7ee] p-3 text-[#35291b]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#20180f] text-[#e8c98f]"><Smartphone className="size-5" /></span>
          <div>
            <p className="text-sm font-bold">ثبّت تطبيق إدارة العنود</p>
            <p className="text-xs text-[#756650]">افتحه من أيقونة مستقلة على شاشة هاتفك</p>
          </div>
        </div>
        <button type="button" onClick={install} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#241b11] px-4 py-2 text-sm font-semibold text-white">
          <Download className="size-4" />
          {installPrompt ? 'تثبيت الآن' : 'طريقة التثبيت'}
        </button>
      </div>
      {showHelp ? (
        <div className="relative rounded-2xl border border-border bg-card p-4 pe-10 text-sm">
          <button type="button" onClick={() => setShowHelp(false)} aria-label="إغلاق التعليمات" className="absolute end-3 top-3 rounded-lg p-1 text-muted-foreground"><X className="size-4" /></button>
          {isIos ? (
            <ol className="list-decimal space-y-2 ps-5">
              <li>افتح هذه الصفحة من متصفح <strong>Safari</strong> على الآيفون.</li>
              <li className="flex flex-wrap items-center gap-1">اضغط زر المشاركة <Share className="inline size-4" /> أسفل الشاشة.</li>
              <li>اختر <strong>Add to Home Screen</strong> أو «إضافة إلى الشاشة الرئيسية».</li>
              <li>اضغط «إضافة». ستظهر أيقونة «إدارة العنود» على الشاشة.</li>
            </ol>
          ) : (
            <ol className="list-decimal space-y-2 ps-5">
              <li>افتح الصفحة من متصفح <strong>Google Chrome</strong>.</li>
              <li>افتح قائمة المتصفح ⋮ ثم اختر <strong>Install app</strong> أو «تثبيت التطبيق».</li>
              <li>أكد التثبيت، وستظهر أيقونة «إدارة العنود» على الشاشة.</li>
            </ol>
          )}
          <p className="mt-3 text-xs text-muted-foreground">التطبيق يحتاج اتصال إنترنت لعرض بيانات الإدارة وحمايتها، ولا يحفظ الطلبات أو بيانات العملاء على الهاتف دون اتصال.</p>
        </div>
      ) : null}
    </section>
  )
}
