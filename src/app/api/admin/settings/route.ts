import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db("accenture")
    const settings = await db.collection("settings").find({}).toArray()

    // Convert to a record object { type: { ...data } }
    const settingsMap = settings.reduce((acc, doc) => {
      acc[doc.type] = doc
      return acc
    }, {} as Record<string, unknown>)

    return NextResponse.json({ settings: settingsMap })
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: "Missing type or data" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("accenture")

    await db.collection("settings").updateOne(
      { type },
      { $set: { ...data, type, updatedAt: new Date() } },
      { upsert: true }
    )

    await logAudit({
      actor: session.username,
      action: "SETTINGS_UPDATED",
      entity: "settings",
      entityId: type,
      metadata: { type }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
