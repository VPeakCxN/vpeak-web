'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import ClientProviders from "@/components/ClientProviders"
import SiteHeader from "@/components/header"
import { SiteFooter } from "@/components/footer"
import { Sidebar } from '@/components/sidebar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showLayout, setShowLayout] = useState(true)

  useEffect(() => {
    const noLayoutPaths = ['/', '/login', '/login/email', '/setup', '/auth/error']
    setShowLayout(!noLayoutPaths.includes(pathname))
  }, [pathname])

  if (!showLayout) {
    return (
      <ClientProviders>
        {children}
      </ClientProviders>
    )
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1">
          <ClientProviders>
            {children}
          </ClientProviders>
        </main>
      </div>
      <SiteFooter />
    </>
  )
}