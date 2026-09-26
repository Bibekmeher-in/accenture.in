import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const returnUrl = url.searchParams.get("redirect") || "/account"

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    // Graceful error redirect informing customer that Google OAuth requires credentials
    const redirectUrl = new URL("/auth/login", url.origin)
    redirectUrl.searchParams.set("error", "google_unconfigured")
    if (returnUrl) redirectUrl.searchParams.set("redirect", returnUrl)
    return NextResponse.redirect(redirectUrl)
  }

  // Generate cryptographic state for CSRF protection
  const state = crypto.randomBytes(32).toString("hex")
  const stateData = JSON.stringify({ state, returnUrl })

  // Store state in a short-lived HttpOnly cookie (10 minutes)
  const cookieStore = await cookies()
  cookieStore.set("teknixx_oauth_state", stateData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  })

  // Google OAuth Authorization URL
  const callbackUrl = `${url.origin}/api/auth/google/callback`
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  googleAuthUrl.searchParams.set("client_id", clientId)
  googleAuthUrl.searchParams.set("redirect_uri", callbackUrl)
  googleAuthUrl.searchParams.set("response_type", "code")
  googleAuthUrl.searchParams.set("scope", "openid email profile")
  googleAuthUrl.searchParams.set("state", state)
  googleAuthUrl.searchParams.set("prompt", "select_account")

  return NextResponse.redirect(googleAuthUrl.toString())
}
