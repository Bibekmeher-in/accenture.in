import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { CookieBanner } from "@/components/cookies/CookieBanner";
import clientPromise from "@/lib/mongodb";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Accenture.in | Professional IT Services",
    template: "%s | Accenture.in",
  },
  description: "We build digital solutions that help businesses grow with modern software architecture and digital strategy.",
  openGraph: {
    title: "Accenture.in | Professional IT Services",
    description: "We build digital solutions that help businesses grow with modern software architecture and digital strategy.",
    url: baseUrl,
    siteName: "Accenture.in",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Accenture.in | Professional IT Services",
    description: "We build digital solutions that help businesses grow.",
  },
  robots: {
    index: true,
    follow: true,
  }
};

import { PublicLayoutWrapper } from "@/components/layout/PublicLayoutWrapper";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch cookie settings safely
  let cookieSettings = {
    enabled: true,
    bannerText: "We use cookies to improve your experience and analyze site traffic. By continuing to use this site, you consent to our use of cookies.",
    privacyPolicyUrl: "/privacy-policy"
  }

  try {
    const client = await clientPromise
    const db = client.db("accenture")
    const settingsDoc = await db.collection("settings").findOne({ type: "cookie_consent" })
    if (settingsDoc) {
      cookieSettings = {
        enabled: settingsDoc.enabled ?? true,
        bannerText: settingsDoc.bannerText || cookieSettings.bannerText,
        privacyPolicyUrl: settingsDoc.privacyPolicyUrl || cookieSettings.privacyPolicyUrl
      }
    }
  } catch (e) {
    console.error("Failed to fetch cookie settings", e)
  }

  return (
    <html lang="en" className={`${inter.variable} antialiased h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <AnalyticsProvider>
          <PublicLayoutWrapper navbar={<Navbar />} footer={<Footer />}>
            {children}
          </PublicLayoutWrapper>
          <CookieBanner settings={cookieSettings} />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
