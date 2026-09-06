"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { updateCookieSettings } from "./actions"

interface Settings {
  enabled: boolean
  bannerText: string
  privacyPolicyUrl: string
}

export function CookieSettingsForm({ settings }: { settings: Settings }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    const res = await updateCookieSettings(data)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-xl max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-md text-sm border border-red-500/20">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-500 p-4 rounded-md text-sm border border-green-500/20">
          Settings updated successfully.
        </div>
      )}

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={settings.enabled}
            className="w-5 h-5 accent-primary bg-background border border-border rounded"
          />
          <span className="font-medium text-foreground">Enable Cookie Consent Banner</span>
        </label>
        <p className="text-sm text-muted-foreground mt-2 ml-8">
          When enabled, a banner will appear for new visitors asking for consent before analytics are loaded.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Banner Text</label>
        <textarea
          name="bannerText"
          defaultValue={settings.bannerText}
          required
          rows={3}
          className="w-full px-3 py-2 bg-background border border-border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Privacy Policy URL</label>
        <input
          name="privacyPolicyUrl"
          type="url"
          defaultValue={settings.privacyPolicyUrl}
          required
          className="w-full px-3 py-2 bg-background border border-border rounded-md"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  )
}
