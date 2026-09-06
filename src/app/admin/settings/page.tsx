import { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SettingsForm } from "./SettingsForm"
import { Settings } from "lucide-react"

export const metadata: Metadata = {
  title: "Settings | Admin Dashboard",
}

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) {
    redirect("/admin/login")
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Settings className="w-8 h-8 mr-3 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">Manage your website configuration and preferences.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <SettingsForm isSuperAdmin={session.role === "super_admin"} />
      </div>
    </div>
  )
}
