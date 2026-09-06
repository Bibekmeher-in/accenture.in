import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const normalizedPath = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path

  // Protect all /admin routes except /admin/login
  if (normalizedPath.startsWith("/admin") && normalizedPath !== "/admin/login") {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/login/", request.url))
    }

    const payload = await verifySession(sessionCookie)
    if (!payload) {
      // Invalid or expired token
      return NextResponse.redirect(new URL("/admin/login/", request.url))
    }
  }

  // If trying to access login page while already logged in, redirect to dashboard
  if (normalizedPath === "/admin/login") {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
    if (sessionCookie) {
      const payload = await verifySession(sessionCookie)
      if (payload) {
        return NextResponse.redirect(new URL("/admin/dashboard/", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
