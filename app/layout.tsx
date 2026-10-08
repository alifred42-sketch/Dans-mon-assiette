import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Providers } from "./providers";
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
  description: "Les 52 semaines d’Aline : choisir la semaine, ouvrir une fiche, recalculer les courses.",
  manifest: `${BASE_PATH}/manifest.json`,
  appleWebApp: { capable: true, title: "CUISINE CHIC OUF !", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: `${BASE_PATH}/icon.svg`, type: "image/svg+xml" },
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
