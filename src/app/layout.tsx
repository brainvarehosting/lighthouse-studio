import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-head",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lighthouse Studios | Premium Podcast & Video Production Studio",
  description: "Experience world-class podcasting and video production at Lighthouse Studios. 4K cinematic setups, soundproof environment, and expert production crew.",
  keywords: ["podcast studio", "video production", "product shoot", "live streaming", "cinematic lighting", "soundproof studio"],
  openGraph: {
    title: "Lighthouse Studios | Premium Podcast & Video Production Studio",
    description: "Elevate your content with 4K cinematic production and crystal clear audio.",
    type: "website",
    url: "https://your-studio.pages.dev/",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${spaceGrotesk.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
