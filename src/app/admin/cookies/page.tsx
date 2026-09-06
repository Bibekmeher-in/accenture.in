import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import { CookieSettingsForm } from "./CookieSettings"


export const metadata: Metadata = {
  title: "Cookie Settings | Admin Portal",
}

export default async function CookiesPage() {
  const { authorized } = await requireRole("super_admin")
  if (!authorized) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Unauthorized: You must be a Super Admin to view this page.
      </div>
    )
  }

  const client = await clientPromise
  const db = client.db("accenture")

  const settingsDoc = await db.collection("settings").findOne({ type: "cookie_consent" })

  const settings = {
    enabled: settingsDoc?.enabled ?? true,
    bannerText: settingsDoc?.bannerText || "We use cookies to improve your experience and analyze site traffic. By continuing to use this site, you consent to our use of cookies.",
    privacyPolicyUrl: settingsDoc?.privacyPolicyUrl || "/privacy-policy",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Cookie Consent Settings</h1>
        <p className="text-muted-foreground mt-2">Manage the privacy banner and compliance settings for your website.</p>
      </div>

      <CookieSettingsForm settings={settings} />
    </div>
  )
}
