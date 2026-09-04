import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics, GoogleAdSense } from "@/components/analytics";
import { PwaInstallPromptWrapper } from "@/components/app/pwa-install-prompt-wrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://pakvisa-advisor.vercel.app'),
  title: "PakVisa Advisor — Pakistani Passport Visa Checker & Travel Tools",
  description:
    "Free AI-powered visa intelligence for Pakistani passport holders. Check visa requirements for 70+ countries, compare visa-free & visa-on-arrival destinations, estimate trip budgets in PKR, track your visa application with WhatsApp reminders — all in one place.",
  keywords: [
    "Pakistani passport visa free countries",
    "Pakistan visa requirements",
    "PakVisa Advisor",
    "visa eligibility checker Pakistan",
    "Pakistani passport ranking",
    "visa on arrival Pakistan",
    "e-Visa Pakistan",
    "PKR currency converter",
    "Pakistan travel budget calculator",
    "Schengen visa Pakistan",
    "Malaysia visa Pakistan",
    "UAE visa Pakistan",
    "Turkey visa Pakistan",
    "Saudi Arabia visa Pakistan",
    "Thailand visa Pakistan",
    "Pakistani passport strength",
    "how to apply visa from Pakistan",
    "visa documents Pakistan",
    "visa free countries for Pakistani passport 2026",
    "countries without visa for Pakistan",
    "Pakistani passport visa on arrival list",
    "e visa countries for Pakistani citizens",
    "UAE visa from Pakistan requirements",
    "Saudi Arabia visa Pakistan guide",
    "Turkey e-visa Pakistani passport",
    "Malaysia visa-free Pakistani",
    "Schengen visa from Pakistan step by step",
    "UK visa Pakistan documents required",
    "USA visa Pakistan how to apply",
    "Canada visa Pakistan processing time",
    "Australia visa Pakistan fee",
    "best countries to visit from Pakistan",
    "cheapest visa countries for Pakistani",
    "visa tracker Pakistan",
    "visa application tracker WhatsApp",
    "Pakistan visa guide 2026",
  ],
  authors: [{ name: "PakVisa Advisor Team" }],
  creator: "PakVisa Advisor",
  publisher: "PakVisa Advisor",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
    bingBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pakvisa-advisor.vercel.app",
    siteName: "PakVisa Advisor",
    title: "PakVisa Advisor — Pakistani Passport Visa Checker & Travel Tools",
    description: "Free AI-powered visa intelligence for Pakistani passport holders. Check visa requirements for 70+ countries, compare visa-free & visa-on-arrival destinations, estimate trip budgets in PKR, track your visa application — all in one place.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PakVisa Advisor — Pakistani Passport Visa Checker',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PakVisa Advisor — Pakistani Passport Visa Checker & Travel Tools",
    description: "Free AI-powered visa intelligence for Pakistani passport holders. Check visa requirements for 70+ countries, compare visa-free & visa-on-arrival destinations, estimate trip budgets in PKR.",
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  verification: {
    google: "aXhN2r-V-uKdvYHhLmnjF8OOpLW48PPCx8_AZrEq3as",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
        <GoogleAdSense />
        <meta name="google-site-verification" content="aXhN2r-V-uKdvYHhLmnjF8OOpLW48PPCx8_AZrEq3as" />
        <meta name="impact-site-verification" content="d482a492-cd48-44cc-a7e7-592734249e0f" />
        <meta name="theme-color" content="#059669" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PakVisa" />
        <meta name="application-name" content="PakVisa" />
        <meta name="msapplication-TileColor" content="#059669" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://pakvisa-advisor.vercel.app" />
        <link rel="icon" href="/icon.png?v=2" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon.ico?v=2" sizes="32x32" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" />
        {/* Force-unregister any existing service worker that may be cached
            in users' browsers from a previous version. The SW was causing
            'TypeError: Failed to fetch' errors on API routes. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(reg){reg.unregister()})})}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "PakVisa Advisor",
              url: "https://pakvisa-advisor.vercel.app",
              description: "AI-powered visa eligibility checker and travel tools for Pakistani passport holders.",
              applicationCategory: "TravelApplication",
              operatingSystem: "All",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "PKR",
              },
              // aggregateRating removed until real review data is collected
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is PakVisa Advisor and how does it work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "PakVisa Advisor is a free AI-powered tool for Pakistani passport holders. It provides visa requirement checks for 70+ countries, personalized eligibility scoring, currency conversion, trip budget estimation, and embassy information.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Which countries can Pakistani citizens visit without a visa?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Pakistani passport holders can visit several countries visa-free, including Malaysia (30 days), Dominica, Micronesia, Vanuatu, Trinidad & Tobago, and Saint Vincent & the Grenadines. Many more offer visa on arrival or e-Visa.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How strong is the Pakistani passport globally?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "The Pakistani passport is ranked around 100-110th on the Henley Passport Index. Countries in the Middle East and Southeast Asia are the most accessible for Pakistani travelers.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <PwaInstallPromptWrapper />
          <Toaster position="top-right" richColors />
        </ThemeProvider>

      </body>
    </html>
  );
}
