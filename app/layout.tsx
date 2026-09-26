import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, M_PLUS_Rounded_1c } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { CatalogSidebarProvider } from "@/components/CatalogSidebarContext";
import { CatalogUrlSync } from "@/components/CatalogUrlSync";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PlayStatsProvider } from "@/components/PlayStatsProvider";
import { SiteSidebar } from "@/components/SiteSidebar";
import { getAllGames } from "@/lib/games";
import { SITE_DESCRIPTION, SITE_NAME, SITE_NAME_EN, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = M_PLUS_Rounded_1c({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} (${SITE_NAME_EN}) — ブラウザで遊べるボードゲーム（無料）`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SITE_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#12101a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const games = getAllGames();

  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} font-sans antialiased`}
      >
        <CatalogSidebarProvider games={games}>
          <Suspense fallback={null}>
            <CatalogUrlSync />
          </Suspense>
          <PlayStatsProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
          >
            本文へスキップ
          </a>
          <div className="flex min-h-screen flex-col">
            <Header />
            <SiteSidebar />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          </PlayStatsProvider>
        </CatalogSidebarProvider>
      </body>
    </html>
  );
}
