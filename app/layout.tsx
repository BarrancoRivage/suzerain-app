import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Suzerain — Un royaume. Six semaines. Un trône.",
  description:
    "Jeu de stratégie médiévale asynchrone. Bâtissez, conquérez, trahissez.",
  applicationName: "Suzerain",
  authors: [{ name: "Antoine" }, { name: "Grégory" }, { name: "Justin" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Suzerain — Un royaume. Six semaines. Un trône.",
    description:
      "Jeu de stratégie médiévale asynchrone. Bâtissez, conquérez, trahissez.",
    type: "website",
    images: ["/favicon.svg"],
  },
  twitter: {
    card: "summary",
    title: "Suzerain",
    description:
      "Jeu de stratégie médiévale asynchrone. Bâtissez, conquérez, trahissez.",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5EFE0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
