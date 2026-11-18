import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VYRAL_BRAND } from "@/lib/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${VYRAL_BRAND.name} — ${VYRAL_BRAND.positioning}`,
  description: `${VYRAL_BRAND.primaryTagline} ${VYRAL_BRAND.secondaryTagline} AI-powered viral video intelligence, short-form clip generation, kinetic subtitle studio, and multi-platform publishing optimizer.`,
  openGraph: {
    title: `${VYRAL_BRAND.name} — ${VYRAL_BRAND.positioning}`,
    description: `${VYRAL_BRAND.primaryTagline} ${VYRAL_BRAND.secondaryTagline}`,
    siteName: VYRAL_BRAND.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${VYRAL_BRAND.name} — ${VYRAL_BRAND.positioning}`,
    description: `${VYRAL_BRAND.primaryTagline} ${VYRAL_BRAND.secondaryTagline}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#FAFBFD] text-[#171923] flex flex-col">
        {children}
      </body>
    </html>
  );
}
