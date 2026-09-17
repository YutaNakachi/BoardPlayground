import type { Metadata, Viewport } from "next";
import { Geist_Mono, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";
import { CatalogSidebarProvider } from "@/components/CatalogSidebarContext";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SiteSidebar } from "@/components/SiteSidebar";
import { getAllGames } from "@/lib/games";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const zenMaru = Zen_Maru_Gothic({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — ブラウザで遊べるボードゲーム（無料）`,
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
        className={`${zenMaru.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <CatalogSidebarProvider games={games}>
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
        </CatalogSidebarProvider>
      </body>
    </html>
  );
}
