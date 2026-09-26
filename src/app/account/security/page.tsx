import React from "react"
import { getCurrentCustomer } from "@/app/actions/customer-auth"
import { SecurityView } from "./SecurityView"
import type { CustomerAuthProvider } from "@/lib/customer-types"

export default async function CustomerSecurityPage() {
  const customer = await getCurrentCustomer()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Security & Authentication</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your password and review your connected authentication methods.
        </p>
      </div>

      <SecurityView
        authProviders={customer?.authProviders || []}
        hasEmailPassword={customer?.authProviders?.some((p: CustomerAuthProvider) => p.provider === "email") ?? false}
      />
    </div>
  )
}
