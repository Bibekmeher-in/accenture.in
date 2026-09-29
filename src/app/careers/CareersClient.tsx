"use client"

import React, { useState, useEffect, useTransition } from "react"
import { Container } from "@/components/ui/Container"
import { AuthModal } from "@/components/auth/AuthModal"
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Users,
  Sparkles,
  ShieldCheck,
  X,
  Download
} from "lucide-react"

interface ApplicationSummary {
  id: string
  name: string
  email: string
  phone?: string
  originalFilename: string
  fileSize: number
  status: string
  createdAt: string
  updatedAt: string
}

export function CareersClient() {
  const [customerSession, setCustomerSession] = useState<{ customerId: string; email: string; name: string } | null>(null)
  const [existingApplication, setExistingApplication] = useState<ApplicationSummary | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Form states
  const [applicantName, setApplicantName] = useState("")
  const [applicantEmail, setApplicantEmail] = useState("")
  const [applicantPhone, setApplicantPhone] = useState("")
  const [coverNote, setCoverNote] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Load session & check previous application
  const loadSessionAndApplication = React.useCallback(async () => {
    try {
      const sessionRes = await fetch("/api/customer/session")
      const sessionData = await sessionRes.json()

      if (sessionData.authenticated && sessionData.session) {
        setCustomerSession(sessionData.session)
        setApplicantName(sessionData.session.name || "")
        setApplicantEmail(sessionData.session.email || "")

        // Fetch application status
        const appRes = await fetch("/api/careers/my-application")
        const appData = await appRes.json()
        if (appData.authenticated && appData.application) {
          setExistingApplication(appData.application)
        }
      } else {
        setCustomerSession(null)
        setExistingApplication(null)
      }
    } catch (err) {
      console.error("Session check error:", err)
    } finally {
      setIsLoadingSession(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      try {
        const sessionRes = await fetch("/api/customer/session")
        const sessionData = await sessionRes.json()
        if (!isMounted) return

        if (sessionData.authenticated && sessionData.session) {
          setCustomerSession(sessionData.session)
          setApplicantName(sessionData.session.name || "")
          setApplicantEmail(sessionData.session.email || "")

          const appRes = await fetch("/api/careers/my-application")
          const appData = await appRes.json()
          if (!isMounted) return
          if (appData.authenticated && appData.application) {
            setExistingApplication(appData.application)
          }
        } else {
          setCustomerSession(null)
          setExistingApplication(null)
        }
      } catch (err) {
        console.error("Session check error:", err)
      } finally {
        if (isMounted) setIsLoadingSession(false)
      }
    }

    init()
    return () => {
      isMounted = false
    }
  }, [])

  const handleUploadClick = () => {
    if (!customerSession) {
      setIsAuthModalOpen(true)
    } else {
      setUploadError(null)
      setUploadSuccess(null)
      setIsUploadModalOpen(true)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    const validExts = [".pdf", ".doc", ".docx"]
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()

    if (!validExts.includes(ext)) {
      setUploadError("Invalid file type. Please upload a PDF, DOC, or DOCX document.")
      setSelectedFile(null)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit. Please upload a smaller file.")
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setUploadError("Please select a resume file to upload.")
      return
    }

    setUploadError(null)
    setUploadSuccess(null)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("file", selectedFile)
        formData.append("name", applicantName)
        formData.append("email", applicantEmail)
        if (applicantPhone) formData.append("phone", applicantPhone)
        if (coverNote) formData.append("coverNote", coverNote)

        const res = await fetch("/api/careers/apply", {
          method: "POST",
          body: formData,
        })

        const data = await res.json()

        if (!res.ok || data.error) {
          setUploadError(data.error || "Failed to upload resume. Please try again.")
        } else {
          setUploadSuccess(data.message || "Your resume has been uploaded successfully!")
          setSelectedFile(null)
          setCoverNote("")
          await loadSessionAndApplication()
          setTimeout(() => {
            setIsUploadModalOpen(false)
          }, 2000)
        }
      } catch {
        setUploadError("A network error occurred. Please try again.")
      }
    })
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 KB"
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Universal Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectUrl="/careers"
        title="Sign in to upload resume"
        subtitle="Sign in with your account to upload and manage your career application."
        onSuccess={() => {
          setIsAuthModalOpen(false)
          loadSessionAndApplication()
          setIsUploadModalOpen(true)
        }}
      />

      {/* Resume Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setIsUploadModalOpen(false)}
          />

          <div
            className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-xs font-black tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
                Talent Application
              </span>
              <h2 className="text-2xl font-black text-foreground mt-3">Upload your Resume / CV</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your resume and we will contact you if a suitable position becomes available.
              </p>
            </div>

            {uploadError && (
              <div className="mb-4 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="leading-snug">{uploadError}</div>
              </div>
            )}

            {uploadSuccess && (
              <div className="mb-4 p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="leading-snug">{uploadSuccess}</div>
              </div>
            )}

            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Full Name *</label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Address *</label>
                <input
                  type="email"
                  required
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Phone Number</label>
                <input
                  type="tel"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* File Upload Box */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-foreground">Resume File (PDF, DOC, DOCX - max 10MB) *</label>
                <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-6 text-center transition-colors bg-muted/20">
                  <input
                    type="file"
                    id="resume-upload-input"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="resume-upload-input" className="cursor-pointer block">
                    <FileText className="w-10 h-10 text-primary mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <p className="font-bold text-sm text-foreground">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatFileSize(selectedFile.size)} • Click to change</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-sm text-foreground">Click to browse or drag file here</p>
                        <p className="text-xs text-muted-foreground mt-1">Accepts PDF, DOC, DOCX up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Cover Note / Areas of Interest (Optional)</label>
                <textarea
                  rows={3}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Share a brief introduction, your tech stack, or the roles you are interested in..."
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <button
                type="submit"
                disabled={isPending || !selectedFile}
                className="w-full mt-4 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isPending ? (
                  <span>Uploading Resume...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Submit Application
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              <span>Resumes are stored in private secure storage. No public access.</span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-muted/10 border-b border-border py-20 md:py-28">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-[size:32px]" />
        <Container className="relative">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm tracking-wide mb-6">
              <Sparkles className="w-4 h-4" /> JOIN OUR TALENT NETWORK
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 text-foreground leading-[1.1]">
              Shape the future of technology with TEKNIXX.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Upload your resume and we will contact you if a suitable position becomes available.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={handleUploadClick}
                className="px-8 py-4 bg-primary text-primary-foreground font-bold text-base rounded-2xl hover:bg-primary/90 hover:shadow-xl transition-all flex items-center gap-3 shadow-md"
              >
                <Upload className="w-5 h-5" /> Upload Resume
              </button>

              {!isLoadingSession && !customerSession && (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-6 py-4 bg-card border border-border text-foreground font-bold text-base rounded-2xl hover:bg-muted transition-all"
                >
                  Sign In with Account
                </button>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Container className="py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Existing Application or Info */}
          <div className="lg:col-span-8 space-y-10">
            {/* If user has submitted an application */}
            {existingApplication && (
              <div className="bg-card border border-primary/20 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Submitted Resume</span>
                      <h3 className="text-lg font-bold text-foreground">{existingApplication.originalFilename}</h3>
                    </div>
                  </div>

                  <span className="self-start sm:self-center px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {existingApplication.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Uploaded On</span>
                    <span className="font-semibold text-foreground">
                      {new Date(existingApplication.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">File Size</span>
                    <span className="font-semibold text-foreground">{formatFileSize(existingApplication.fileSize)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Applicant Name</span>
                    <span className="font-semibold text-foreground">{existingApplication.name}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={`/api/careers/resume/${existingApplication.id}/download`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl border border-border transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download My Resume
                  </a>

                  <button
                    onClick={() => {
                      setUploadError(null)
                      setUploadSuccess(null)
                      setIsUploadModalOpen(true)
                    }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Upload Updated Resume →
                  </button>
                </div>
              </div>
            )}

            {/* Current Openings Statement */}
            <div className="bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-sm text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/80 text-muted-foreground flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 opacity-60" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">
                Current Openings
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-4">
                No active openings currently posted
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto mt-3 leading-relaxed">
                We do not have open job vacancies listed at this moment. However, we continuously evaluate candidates for engineering, cloud architecture, design, and full-stack roles.
              </p>
              <p className="text-foreground font-semibold text-sm max-w-lg mx-auto mt-4">
                Upload your resume and we will contact you if a suitable position becomes available.
              </p>
            </div>

            {/* What We Value */}
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-foreground">Why join our talent network?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base mb-1">Direct Technical Review</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Resumes are reviewed directly by technical leads and engineering heads, not filtered out by impersonal bots.
                  </p>
                </div>

                <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base mb-1">Priority Outreach</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When new project teams or specialized roles open, our talent network candidates are contacted first.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Information & Guidelines */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Application Guidelines
              </h3>

              <div className="space-y-4 text-xs text-muted-foreground">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">1</div>
                  <p><strong className="text-foreground">Supported Formats:</strong> PDF (preferred), DOC, or DOCX up to 10MB.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">2</div>
                  <p><strong className="text-foreground">Unified Login:</strong> Your TEKNIXX account works across Careers, Store, and Learning.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">3</div>
                  <p><strong className="text-foreground">Confidential & Secure:</strong> Your resume is stored in private encrypted storage with no public web access.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
