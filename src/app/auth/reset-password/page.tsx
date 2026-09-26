"use client"

import React, { useState, useTransition, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Lock, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react"
import { resetPassword } from "@/app/actions/customer-auth"
import { Container } from "@/components/ui/Container"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(
    !token ? "Missing or invalid password reset token." : null
  )
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!token) {
      setErrorMessage("Missing reset token. Please request a new password reset link.")
      return
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    startTransition(async () => {
      const res = await resetPassword({ token, password, confirmPassword })
      if (res.error) {
        setErrorMessage(res.error)
      } else {
        setSuccessMessage("Password reset successfully! Redirecting to sign in...")
        setTimeout(() => {
          router.push("/auth/login")
        }, 1500)
      }
    })
  }

  return (
    <div className="w-full max-w-md mx-auto bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-xl">
      <div className="text-center mb-8">
        <span className="text-xs font-black tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
          Security Update
        </span>
        <h1 className="text-3xl font-black tracking-tight text-foreground mt-4">Reset password</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Create a strong, new password for your TEKNIXX account.
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">New Password (min 8 chars)</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Confirm New Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !token}
          className="w-full mt-2 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {isPending ? (
            <span>Updating password...</span>
          ) : (
            <>
              Set New Password <ArrowRight className="w-4 h-4" />
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
        <span>Single-Use Cryptographic Reset</span>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 bg-muted/20">
      <Container>
        <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Loading reset form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </Container>
    </div>
  )
}
