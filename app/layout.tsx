import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Providers } from "./providers";
import { SplashGate } from "@/components/splash-gate";
import { BASE_PATH } from "@/lib/base-path";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const heading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CUISINE CHIC OUF !",
  description: "Pas de panique, on mange quoi ce soir ? 52 semaines de menus, du batchcooking simple et vos listes de courses automatisées.",
  manifest: `${BASE_PATH}/manifest.json`,
  appleWebApp: { capable: true, title: "CUISINE CHIC OUF !", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: `${BASE_PATH}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${BASE_PATH}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: `${BASE_PATH}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#8FA89B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${sans.variable} ${heading.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <script dangerouslySetInnerHTML={{ __html: `(() => { try { const path = location.pathname; if (!/[\\/]((semaine)|(courses)|(batch))\\/?$/.test(path) || new URLSearchParams(location.search).has("w")) return; const now = new Date(); const thursday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())); const day = thursday.getUTCDay() || 7; thursday.setUTCDate(thursday.getUTCDate() + 4 - day); const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1)); const week = Math.min(52, Math.max(1, Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7))); const url = new URL(location.href); url.searchParams.set("w", String(week)); history.replaceState(null, "", url); } catch {} })();` }} />
        <script dangerouslySetInnerHTML={{ __html: `(() => { try { const key = "assiette-cache-reset-v8"; if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); Promise.all([navigator.serviceWorker?.getRegistrations?.().then((rs) => Promise.all(rs.map((r) => r.unregister()))), caches?.keys?.().then((ks) => Promise.all(ks.map((k) => caches.delete(k))))]).then(() => location.reload()); } catch {} })();` }} />
        <Providers><SplashGate>{children}</SplashGate></Providers>
      </body>
    </html>
  );
}
