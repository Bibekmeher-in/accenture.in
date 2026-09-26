import { NextResponse } from "next/server"
import { clearCustomerSession } from "@/lib/customer-auth"

export async function POST() {
  await clearCustomerSession()
  return NextResponse.json({ success: true })
}
