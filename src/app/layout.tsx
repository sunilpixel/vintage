import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import "@/styles/chrome.css";
import "@/styles/sections.css";
import "@/styles/mobile.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// variable — no weight list, so the tracked-out labels can sit at 500 without a second file
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Vintage Motors — Timeless Machines · Est. 1958",
  description:
    "A private collection of vintage and classic automobiles — Jaguar E-Type, Mercedes-Benz 300 SL, Porsche 356, Aston Martin DB5, Ferrari 250 GT. Restored by hand, driven with passion.",
  openGraph: {
    title: "Vintage Motors — Timeless Machines",
    description: "Six machines, one family. A private collection told as a film in nine chapters.",
    images: ["/img/hero.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f4efe5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}
