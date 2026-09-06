"use client"

import React, { Suspense } from "react"
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker"

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      {children}
    </>
  )
}
