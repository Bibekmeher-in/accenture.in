import { Metadata } from "next"
import ClientLayout from "./ClientLayout"

export const metadata: Metadata = {
  title: "Admin Portal | TEKNIXX",
  robots: {
    index: false,
    follow: false,
  },
}

import { getSession } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  return <ClientLayout role={session?.role || "admin"}>{children}</ClientLayout>
}
