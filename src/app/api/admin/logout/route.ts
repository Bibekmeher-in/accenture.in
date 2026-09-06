import { NextResponse } from "next/server"
import { clearSession, getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function POST() {
  const session = await getSession()

  if (session) {
    await logAudit({
      actor: session.username,
      action: "ADMIN_LOGOUT",
      entity: "Session",
    })
  }

  await clearSession()
  return NextResponse.json({ success: true })
}
