'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './components/sidebar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const noSidebarPaths = ['/', '/login', '/login/email', '/setup','/auth/error']

  // Only hide sidebar if pathname matches exactly one of the excluded paths
  const showSidebar = !noSidebarPaths.includes(pathname)

  return (
    <div className="flex flex-1">
      {showSidebar && <Sidebar />}
      <main className="flex-1">{children}</main>
    </div>
  )
}
