import type { Metadata } from "next";
import "./globals.css";
import CursorEffect from "@/components/CursorEffect";
import PlantAnnouncement from "@/components/PlantAnnouncement";

export const metadata: Metadata = {
  title: "Anish.Dev — Full Stack Developer",
  description:
    "Full-stack developer crafting bold, electric digital experiences at the intersection of design and engineering.",
  keywords: [
    "developer",
    "portfolio",
    "full-stack",
    "creative",
    "next.js",
    "react",
    "typescript",
  ],
  openGraph: {
    title: "Anish.Dev — Full Stack Developer",
    description:
      "Full-stack developer crafting bold, electric digital experiences.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="antialiased">
        <CursorEffect />
        <PlantAnnouncement />
        {children}
      </body>
    </html>
  );
}
