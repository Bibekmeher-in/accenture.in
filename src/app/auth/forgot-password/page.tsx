"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import { Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react"
import { requestPasswordReset } from "@/app/actions/customer-auth"
import { Container } from "@/components/ui/Container"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [debugToken, setDebugToken] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setDebugToken(null)

    startTransition(async () => {
      const res = await requestPasswordReset(email)
      if (res.error) {
        setErrorMessage(res.error)
      } else {
        setSuccessMessage(res.message || "Password reset instructions have been generated.")
        if (res.debugToken) {
          setDebugToken(res.debugToken)
        }
      }
    })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 bg-muted/20">
      <Container>
        <div className="w-full max-w-md mx-auto bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-xl">
          <div className="text-center mb-8">
            <span className="text-xs font-black tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
              Password Recovery
            </span>
            <h1 className="text-3xl font-black tracking-tight text-foreground mt-4">Forgot password?</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your email address and we&apos;ll send you instructions to reset your password.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="leading-snug">{successMessage}</div>
            </div>
          )}

          {debugToken && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm">
              <p className="font-bold text-primary mb-1">Development / Demo Reset Link:</p>
              <Link
                href={`/auth/reset-password?token=${debugToken}`}
                className="text-xs text-primary underline break-all font-mono hover:opacity-80"
              >
                /auth/reset-password?token={debugToken}
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isPending ? (
                <span>Sending...</span>
              ) : (
                <>
                  Send Reset Link <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm font-semibold text-primary hover:underline gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>Encrypted Single-Use Recovery Token</span>
          </div>
        </div>
      </Container>
    </div>
  )
}
