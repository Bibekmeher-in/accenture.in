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
    default: "TEKNIXX | Professional IT Services",
    template: "%s | TEKNIXX",
  },
  description: "We build digital solutions that help businesses grow with modern software architecture and digital strategy.",
  openGraph: {
    title: "TEKNIXX | Professional IT Services",
    description: "We build digital solutions that help businesses grow with modern software architecture and digital strategy.",
    url: baseUrl,
    siteName: "TEKNIXX",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TEKNIXX | Professional IT Services",
    description: "We build digital solutions that help businesses grow.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/logo.png" },
      { url: "/icon.png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

import { PublicLayoutWrapper } from "@/components/layout/PublicLayoutWrapper";
import { CartProvider } from "@/components/store/CartProvider";
import { CartDrawer } from "@/components/store/CartDrawer";

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
          <CartProvider>
            <PublicLayoutWrapper navbar={<Navbar />} footer={<Footer />}>
              {children}
            </PublicLayoutWrapper>
            <CartDrawer />
          </CartProvider>
          <CookieBanner settings={cookieSettings} />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
