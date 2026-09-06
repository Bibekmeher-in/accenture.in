"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react"

type SettingsFormProps = {
  isSuperAdmin: boolean
}

export function SettingsForm({ isSuperAdmin }: SettingsFormProps) {
  const [activeTab, setActiveTab] = React.useState("general")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: "success" | "error", text: string } | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [settings, setSettings] = React.useState<Record<string, Record<string, any>>>({
    general: { siteName: "Accenture.in", description: "Professional IT Services" },
    contact: { email: "", phone: "", address: "" },
  })

  React.useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings")
        if (res.ok) {
          const data = await res.json()
          setSettings((prev) => ({ ...prev, ...data.settings }))
        }
      } catch (err) {
        console.error("Failed to load settings:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleChange = (type: string, field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [type]: {
        ...(prev[type] || {}),
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    if (!isSuperAdmin) {
      setMessage({ type: "error", text: "Only Super Admins can update settings." })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, data: settings[activeTab] || {} })
      })

      if (!res.ok) throw new Error("Failed to save")

      setMessage({ type: "success", text: "Settings saved successfully." })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error("Failed to save settings:", err)
      setMessage({ type: "error", text: "An error occurred while saving." })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const tabs = [
    { id: "general", label: "General" },
    { id: "contact", label: "Contact Info" },
    { id: "cookie_consent", label: "Cookies & Privacy" },
  ]

  return (
    <div className="flex flex-col md:flex-row min-h-[500px]">
      <div className="w-full md:w-64 bg-muted/30 border-r border-border p-4 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setMessage(null)
            }}
            className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <div className="flex-1 space-y-6">
          {activeTab === "general" && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-lg font-medium">General Settings</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Site Name</label>
                <input
                  type="text"
                  value={settings.general?.siteName || ""}
                  onChange={(e) => handleChange("general", "siteName", e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  disabled={!isSuperAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Site Description</label>
                <textarea
                  value={settings.general?.description || ""}
                  onChange={(e) => handleChange("general", "description", e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  rows={4}
                  disabled={!isSuperAdmin}
                />
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Business Email</label>
                <input
                  type="email"
                  value={settings.contact?.email || ""}
                  onChange={(e) => handleChange("contact", "email", e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  disabled={!isSuperAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={settings.contact?.phone || ""}
                  onChange={(e) => handleChange("contact", "phone", e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  disabled={!isSuperAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={settings.contact?.address || ""}
                  onChange={(e) => handleChange("contact", "address", e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  rows={3}
                  disabled={!isSuperAdmin}
                />
              </div>
            </div>
          )}

          {activeTab === "cookie_consent" && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-lg font-medium">Cookie Consent Banner</h3>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="cookieEnabled"
                  checked={settings.cookie_consent?.enabled ?? true}
                  onChange={(e) => handleChange("cookie_consent", "enabled", e.target.checked.toString())}
                  disabled={!isSuperAdmin}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="cookieEnabled" className="text-sm font-medium">Enable Cookie Consent Banner</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Banner Text</label>
                <textarea
                  value={settings.cookie_consent?.bannerText || "We use cookies to improve your experience and analyze site traffic. By continuing to use this site, you consent to our use of cookies."}
                  onChange={(e) => handleChange("cookie_consent", "bannerText", e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  rows={3}
                  disabled={!isSuperAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Privacy Policy URL</label>
                <input
                  type="text"
                  value={settings.cookie_consent?.privacyPolicyUrl || "/privacy-policy"}
                  onChange={(e) => handleChange("cookie_consent", "privacyPolicyUrl", e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  disabled={!isSuperAdmin}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
          <div>
            {message && (
              <div className={`flex items-center text-sm ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                {message.type === 'error' ? <AlertCircle className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {message.text}
              </div>
            )}
            {!isSuperAdmin && !message && (
              <div className="flex items-center text-sm text-amber-500">
                <AlertCircle className="w-4 h-4 mr-2" />
                Only Super Admins can update settings
              </div>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={!isSuperAdmin || isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
