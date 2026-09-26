"use client"

import React, { useState, useTransition } from "react"
import { Lock, ShieldCheck, CheckCircle2, AlertCircle, KeyRound, Globe } from "lucide-react"
import { changePassword } from "@/app/actions/customer-auth"
import type { CustomerAuthProvider } from "@/lib/customer-types"

export function SecurityView({
  authProviders,
  hasEmailPassword,
}: {
  authProviders: CustomerAuthProvider[]
  hasEmailPassword: boolean
}) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.")
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    startTransition(async () => {
      const res = await changePassword({ currentPassword, newPassword, confirmPassword })
      if (res.error) {
        setErrorMessage(res.error)
      } else {
        setSuccessMessage("Your password has been updated successfully.")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    })
  }

  const hasGoogle = authProviders.some((p) => p.provider === "google")

  return (
    <div className="space-y-8">
      {/* Connected Authentication Providers */}
      <div className="p-6 bg-card border border-border rounded-2xl space-y-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> Connected Sign-in Methods
        </h3>
        <p className="text-xs text-muted-foreground">
          You can authenticate using any of your verified sign-in methods.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Email & Password</p>
                <p className="text-xs text-muted-foreground">Standard password credentials</p>
              </div>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                hasEmailPassword ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
              }`}
            >
              {hasEmailPassword ? "Active" : "Not Set"}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Google OAuth</p>
                <p className="text-xs text-muted-foreground">Google Account sign-in</p>
              </div>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                hasGoogle ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
              }`}
            >
              {hasGoogle ? "Linked" : "Not Linked"}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="p-6 bg-card border border-border rounded-2xl space-y-6">
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Update Password
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ensure your account is using a long, random password for maximum security.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-600 dark:text-green-400 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{successMessage}</div>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          {hasEmailPassword && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">New Password (min 8 characters)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
          >
            {isPending ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      </div>

      <div className="pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-green-500" />
        <span>Passwords are securely hashed with bcrypt using high-work-factor salt rounds. Plaintext is never stored.</span>
      </div>
    </div>
  )
}
