import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/theme/provider";
import { Toaster } from "@/components/ui/sonner";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "./convex/ConvexClientProvider";
import ReduxProvider from "@/redux/provider";
import { ProfileQuery } from "./convex/query.config";
import { normalizeProfile, ConvexUserRaw } from "@/types/user";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://draftly-huawei.vercel.app/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Draftly — AI Design Copilot for Morocco",
    template: "%s | Draftly",
  },
  description:
    "Draftly helps North African teams turn sketches into production-ready UI: autosave canvases, AI style guides, and Huawei Cloud-native workflows powered by Convex + Inngest.",
  keywords: [
    "Draftly",
    "Huawei Cloud",
    "AI design copilot",
    "Convex",
    "Inngest",
    "Morocco design",
    "Next.js 16",
  ],
  authors: [{ name: "Draftly Team" }],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    url: siteUrl,
    type: "website",
    title: "Draftly — Huawei Cloud Native Design Copilot",
    description:
      "Collaborate on canvases, moodboards, and AI-built style guides tuned for Morocco’s creative economy.",
    siteName: "Draftly",
  },
  twitter: {
    card: "summary_large_image",
    site: "@draftly",
    title: "Draftly — Sketch to Production on Huawei Cloud",
    description:
      "Auto-generate style guides, autosave canvases, and sync subscriptions with Convex + Inngest.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const rawProfile = await ProfileQuery()
  const profile = normalizeProfile(rawProfile as unknown as ConvexUserRaw | null);


  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" className="bg-background">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <ReduxProvider preloadedState={{profile: { user: profile }}}>
                {children}
                <Toaster />
              </ReduxProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
