import React from "react"
import { getCurrentCustomer } from "@/app/actions/customer-auth"
import { ProfileForm } from "./ProfileForm"
import { ShieldCheck, Calendar, Mail } from "lucide-react"

export default async function CustomerProfilePage() {
  const customer = await getCurrentCustomer()

  if (!customer) {
    return <div className="text-center py-12 text-muted-foreground">Unable to load profile data.</div>
  }

  const joinDate = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recent"

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Personal Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal details, contact information, and account settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/40 rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Primary Email</p>
            <p className="text-sm font-bold text-foreground">{customer.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Member Since</p>
            <p className="text-sm font-bold text-foreground">{joinDate}</p>
          </div>
        </div>
      </div>

      <ProfileForm
        initialData={{
          name: customer.name,
          phone: customer.phone || "",
        }}
      />

      <div className="pt-6 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-green-500" />
        <span>Your personal data is encrypted and only used to fulfill your orders and services.</span>
      </div>
    </div>
  )
}
