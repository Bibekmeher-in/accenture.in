"use server"

import { revalidatePath } from "next/cache"
import clientPromise from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const CookieSettingsSchema = z.object({
  enabled: z.boolean(),
  bannerText: z.string().min(1).max(500),
  privacyPolicyUrl: z.string().url().max(200),
})

export async function updateCookieSettings(data: Record<string, unknown>) {
  try {
    const { authorized, session } = await requireRole("super_admin")
    if (!authorized || !session) return { error: "Unauthorized" }

    const parsed = CookieSettingsSchema.safeParse({
      enabled: data.enabled === "on" || data.enabled === true,
      bannerText: data.bannerText,
      privacyPolicyUrl: data.privacyPolicyUrl,
    })

    if (!parsed.success) {
      return { error: "Invalid cookie settings" }
    }

    const client = await clientPromise
    const db = client.db("accenture")

    // We store settings in a single document in a "settings" collection
    await db.collection("settings").updateOne(
      { type: "cookie_consent" },
      {
        $set: {
          type: "cookie_consent",
          ...parsed.data,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    )

    await logAudit({
      actor: session.username,
      action: "SETTINGS_UPDATED",
      entity: "CookieSettings",
      metadata: { enabled: parsed.data.enabled }
    })

    // Revalidate everything that uses the banner
    revalidatePath("/", "layout")
    return { success: true }
  } catch {
    return { error: "Failed to update cookie settings" }
  }
}
