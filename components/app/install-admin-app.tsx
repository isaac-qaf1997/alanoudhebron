'use client'

import { useEffect } from 'react'

export function InstallAdminApp() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/admin-app-sw.js', { scope: '/' }).catch((error) => {
      console.error('[alanoud-admin:pwa]', error)
    })
  }, [])

  return null
}
