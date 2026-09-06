"use client"

import { usePathname } from "next/navigation"

export function PublicLayoutWrapper({
  children,
  navbar,
  footer
}: {
  children: React.ReactNode,
  navbar: React.ReactNode,
  footer: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdminPath = pathname.startsWith("/admin")

  return (
    <>
      {!isAdminPath && navbar}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {!isAdminPath && footer}
    </>
  )
}
