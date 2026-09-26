import React from "react"
import { getCurrentCustomer } from "@/app/actions/customer-auth"
import { AddressManager } from "./AddressManager"

export default async function CustomerAddressesPage() {
  const customer = await getCurrentCustomer()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Saved Addresses</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your delivery addresses for seamless, one-click checkout.
        </p>
      </div>

      <AddressManager initialAddresses={customer?.addresses || []} />
    </div>
  )
}
