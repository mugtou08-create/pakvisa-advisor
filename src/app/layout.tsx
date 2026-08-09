import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
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
  title: "PakVisa Advisor — Pakistani Passport Visa Checker & Travel Tools",
  description:
    "Free AI-powered visa intelligence for Pakistani passport holders. Check visa requirements for 70+ countries, convert PKR currencies, estimate trip budgets, compare destinations, and plan your travels — all in one place.",
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
    url: "https://pakvisaadvisor.com",
    siteName: "PakVisa Advisor",
    title: "PakVisa Advisor — Pakistani Passport Visa Checker & Travel Tools",
    description: "Free AI-powered visa intelligence for Pakistani passport holders. Check visa requirements for 70+ countries, convert currencies, and estimate trip budgets.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PakVisa Advisor — Pakistani Passport Visa Checker & Travel Tools",
    description: "Free AI-powered visa intelligence for Pakistani passport holders. Check visa requirements for 70+ countries, convert currencies, and estimate trip budgets.",
  },
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  verification: {
    google: "google-site-verification-code-here",
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
        <meta name="theme-color" content="#f97316" />
        <link rel="canonical" href="https://pakvisaadvisor.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "PakVisa Advisor",
              url: "https://pakvisaadvisor.com",
              description: "AI-powered visa eligibility checker and travel tools for Pakistani passport holders.",
              applicationCategory: "TravelApplication",
              operatingSystem: "All",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "PKR",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "2450",
                bestRating: "5",
              },
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
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
