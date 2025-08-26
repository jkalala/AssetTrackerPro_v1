import type { Metadata } from "next";
import { Inter } from "next/font/google";
import * as Sentry from '@sentry/nextjs';
import ClientLayoutShell from "@/components/ClientLayoutShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AssetTracker Pro",
  description: "Professional asset management platform",
  ...(process.env.NODE_ENV === 'production' && {
    other: {
      ...Sentry.getTraceData()
    }
  })
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientLayoutShell>
          {children}
        </ClientLayoutShell>
      </body>
    </html>
  );
}
