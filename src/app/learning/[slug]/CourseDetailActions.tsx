"use client"

import React, { useState, useEffect } from "react"
import { AuthModal } from "@/components/auth/AuthModal"
import { CheckCircle2, Play, BookOpen, Sparkles } from "lucide-react"

export function CourseDetailActions({
  courseSlug,
  buttonType = "hero",
}: {
  courseSlug: string
  buttonType?: "hero" | "sidebar"
}) {
  const [customerSession, setCustomerSession] = useState<{ customerId: string; email: string; name: string } | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)

  useEffect(() => {
    fetch("/api/customer/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.session) {
          setCustomerSession(data.session)
        } else {
          setCustomerSession(null)
        }
      })
      .catch(() => setCustomerSession(null))
  }, [])

  const handleAction = () => {
    if (!customerSession) {
      setIsAuthModalOpen(true)
    } else {
      setIsEnrolled(true)
      const curriculumElem = document.getElementById("course-curriculum-section")
      if (curriculumElem) {
        curriculumElem.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectUrl={`/learning/${courseSlug}`}
        title="Sign in to start learning"
        subtitle="Sign in with your TEKNIXX account to enroll and track your learning progress."
        onSuccess={() => {
          setIsAuthModalOpen(false)
          fetch("/api/customer/session")
            .then((r) => r.json())
            .then((d) => {
              if (d.authenticated && d.session) {
                setCustomerSession(d.session)
                setIsEnrolled(true)
              }
            })
        }}
      />

      {buttonType === "hero" ? (
        <div className="flex items-center gap-4">
          <button
            onClick={handleAction}
            className="px-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-2xl hover:bg-primary/90 hover:shadow-xl transition-all flex items-center gap-2 shadow-md"
          >
            {isEnrolled ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-white" /> Continue Learning
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> Start Learning
              </>
            )}
          </button>
          {isEnrolled && (
            <span className="text-xs font-bold text-green-600 bg-green-500/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Enrolled
            </span>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={handleAction}
            className="w-full py-4 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-all flex items-center justify-center gap-2"
          >
            {isEnrolled ? (
              <>
                <CheckCircle2 className="w-5 h-5" /> Enrolled • Access Content
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" /> Start Course Now
              </>
            )}
          </button>
        </div>
      )}
    </>
  )
}
