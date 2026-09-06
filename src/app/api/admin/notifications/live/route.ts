import { getSession } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await getSession()

  if (!session || !["super_admin", "admin"].includes(session.role)) {
    return new Response("Unauthorized", { status: 401 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      let lastCheck = new Date()

      const interval = setInterval(async () => {
        try {
          const client = await clientPromise
          const db = client.db("accenture")

          const newLeads = await db.collection("leads").find({
            createdAt: { $gt: lastCheck }
          }).toArray()

          if (newLeads.length > 0) {
            lastCheck = new Date()

            for (const lead of newLeads) {
              controller.enqueue(`data: ${JSON.stringify({
                type: "NEW_LEAD",
                message: "New client inquiry received",
                leadName: lead.name,
                leadId: lead._id.toString()
              })}\n\n`)
            }
          } else {
            // Keep-alive ping
            controller.enqueue(`data: ${JSON.stringify({ type: "PING" })}\n\n`)
          }
        } catch (err) {
          console.error("SSE Notifications Interval Error", err)
        }
      }, 5000) // Poll every 5 seconds

      request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  })
}
