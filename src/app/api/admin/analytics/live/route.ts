import { getSession } from "@/lib/auth"
import { getLiveAnalyticsStats } from "@/lib/analytics"

// Node.js runtime for SSE streams
export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await getSession()

  if (!session || session.role !== "super_admin") {
    return new Response("Unauthorized", { status: 401 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data immediately
      try {
        const initialStats = await getLiveAnalyticsStats()
        controller.enqueue(`data: ${JSON.stringify(initialStats)}\n\n`)
      } catch (err) {
        console.error("SSE Initial Data Error", err)
      }

      // Loop to send data every 10 seconds
      const interval = setInterval(async () => {
        try {
          const stats = await getLiveAnalyticsStats()
          controller.enqueue(`data: ${JSON.stringify(stats)}\n\n`)
        } catch (err) {
          console.error("SSE Interval Error", err)
          // Do not close on transient DB errors, keep attempting
        }
      }, 10000)

      // Handle stream disconnect
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
