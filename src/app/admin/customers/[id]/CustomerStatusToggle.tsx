"use client"

import React, { useTransition } from "react"
import { toggleCustomerStatus } from "../actions"
import { UserCheck, UserX } from "lucide-react"

export function CustomerStatusToggle({
  customerId,
  currentStatus,
}: {
  customerId: string
  currentStatus: "Active" | "Disabled"
}) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    const nextStatus = currentStatus === "Active" ? "Disabled" : "Active"
    const message =
      nextStatus === "Disabled"
        ? "Disable this customer account? They will not be able to log in or checkout."
        : "Re-enable this customer account?"

    if (confirm(message)) {
      startTransition(async () => {
        const res = await toggleCustomerStatus(customerId, nextStatus)
        if (res.error) alert(res.error)
        else window.location.reload()
      })
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
        currentStatus === "Active"
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
          : "bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20"
      }`}
    >
      {currentStatus === "Active" ? (
        <>
          <UserX className="w-4 h-4" />
          {isPending ? "Disabling..." : "Disable Account"}
        </>
      ) : (
        <>
          <UserCheck className="w-4 h-4" />
          {isPending ? "Activating..." : "Enable Account"}
        </>
      )}
    </button>
  )
}
