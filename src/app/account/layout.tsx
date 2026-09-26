import React from "react"
import { redirect } from "next/navigation"
import { getCustomerSession } from "@/lib/customer-auth"
import { Container } from "@/components/ui/Container"
import { AccountNav } from "./AccountNav"

export const metadata = {
  title: "My Account | TEKNIXX",
  description: "Manage your TEKNIXX profile, orders, addresses, and account security.",
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getCustomerSession()

  if (!session) {
    redirect("/auth/login?redirect=/account")
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 pt-10">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-foreground">My Account</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{session.name}</span> ({session.email})
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Account Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <AccountNav customerName={session.name} customerEmail={session.email} />
          </aside>

          {/* Main Account Content Area */}
          <main className="lg:col-span-9 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
            {children}
          </main>
        </div>
      </Container>
    </div>
  )
}
