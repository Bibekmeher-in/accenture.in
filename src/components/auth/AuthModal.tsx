"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react"
import { loginCustomer, registerCustomer, requestPasswordReset } from "@/app/actions/customer-auth"

export interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  redirectUrl?: string
  initialMode?: "login" | "register" | "forgot"
  title?: string
  subtitle?: string
  onSuccess?: () => void
}

export function AuthModal({
  isOpen,
  onClose,
  redirectUrl = "/account",
  initialMode = "login",
  title,
  subtitle,
  onSuccess,
}: AuthModalProps) {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register" | "forgot">(initialMode)
  const [isPending, startTransition] = useTransition()

  // Form states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    startTransition(async () => {
      if (mode === "login") {
        const res = await loginCustomer({ email, password })
        if (res.error) {
          setErrorMessage(res.error)
        } else {
          setSuccessMessage("Signed in successfully! Continuing...")
          if (onSuccess) onSuccess()
          setTimeout(() => {
            onClose()
            if (redirectUrl && redirectUrl !== window.location.pathname) {
              router.push(redirectUrl)
            }
            router.refresh()
          }, 500)
        }
      } else if (mode === "register") {
        if (password.length < 8) {
          setErrorMessage("Password must be at least 8 characters long.")
          return
        }
        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match.")
          return
        }

        const res = await registerCustomer({ name, email, password, confirmPassword })
        if (res.error) {
          setErrorMessage(res.error)
        } else {
          setSuccessMessage("Account created successfully! Continuing...")
          if (onSuccess) onSuccess()
          setTimeout(() => {
            onClose()
            if (redirectUrl && redirectUrl !== window.location.pathname) {
              router.push(redirectUrl)
            }
            router.refresh()
          }, 500)
        }
      } else if (mode === "forgot") {
        const res = await requestPasswordReset(email)
        if (res.error) {
          setErrorMessage(res.error)
        } else {
          setSuccessMessage(res.message || "Password reset instructions have been generated.")
        }
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div 
        className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand & Title */}
        <div className="text-center mb-6">
          <span className="text-xs font-black tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
            TEKNIXX Security
          </span>
          <h2 id="auth-modal-title" className="text-2xl font-black tracking-tight text-foreground mt-3">
            {title || (mode === "login" ? "Sign in to continue" : mode === "register" ? "Create your account" : "Reset your password")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle || (mode === "forgot"
              ? "Enter your email to receive password reset instructions."
              : "Sign in once to access Careers, Store, and Learning seamlessly.")}
          </p>
        </div>

        {/* Error / Success alerts */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="leading-snug">{successMessage}</div>
          </div>
        )}

        {/* Google Auth Button (Only in login/register modes) */}
        {mode !== "forgot" && (
          <div className="space-y-4 mb-6">
            <a
              href={`/api/auth/google?redirect=${encodeURIComponent(redirectUrl)}`}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-background border border-border hover:bg-muted text-foreground font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </a>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-border w-full" />
              <span className="bg-card px-3 text-xs uppercase font-medium text-muted-foreground tracking-wider absolute">
                or with email
              </span>
            </div>
          </div>
        )}

        {/* Email Authentication Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          )}

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
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-foreground">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot")
                      setErrorMessage(null)
                      setSuccessMessage(null)
                    }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {isPending ? (
              <span>Processing...</span>
            ) : mode === "login" ? (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === "register" ? (
              <>
                Create Account <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>Send Reset Instructions</>
            )}
          </button>
        </form>

        {/* Footer switches */}
        <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground">
          {mode === "login" && (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register")
                  setErrorMessage(null)
                  setSuccessMessage(null)
                }}
                className="font-bold text-primary hover:underline"
              >
                Create account
              </button>
            </p>
          )}

          {mode === "register" && (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login")
                  setErrorMessage(null)
                  setSuccessMessage(null)
                }}
                className="font-bold text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          )}

          {mode === "forgot" && (
            <p>
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login")
                  setErrorMessage(null)
                  setSuccessMessage(null)
                }}
                className="font-bold text-primary hover:underline"
              >
                Back to sign in
              </button>
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
          <span>256-bit encrypted authentication & session security</span>
        </div>
      </div>
    </div>
  )
}
