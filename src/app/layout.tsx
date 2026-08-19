import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-display"
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "DreamTouch Experience #001 — THE UNKNOWN",
  description:
    "Une expérience immersive à Cotonou où 20 participants vont jouer, apprendre, rencontrer et découvrir. DreamTouch Experience #001 — THE UNKNOWN.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "DreamTouch Experience #001 — THE UNKNOWN",
    description:
      "20 inconnus. Des missions. Des défis. Des rencontres. Des surprises. Le reste... reste UNKNOWN.",
    type: "website",
    images: ["/og-image.svg"]
  },
  twitter: {
    card: "summary_large_image",
    title: "DreamTouch Experience #001 — THE UNKNOWN",
    description: "Tu ne viens pas pour assister. Tu viens vivre une expérience.",
    images: ["/og-image.svg"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-void text-bone font-body antialiased">{children}</body>
    </html>
  );
}
