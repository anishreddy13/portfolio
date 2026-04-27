import type { Metadata } from "next";
import "./globals.css";
import CursorEffect from "@/components/CursorEffect";

export const metadata: Metadata = {
  title: "Portfolio — Creative Developer",
  description:
    "Full-stack developer crafting immersive digital experiences at the intersection of design and technology.",
  keywords: ["developer", "portfolio", "full-stack", "creative", "next.js"],
  openGraph: {
    title: "Portfolio — Creative Developer",
    description: "Full-stack developer crafting immersive digital experiences.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="noise">
      <body className="antialiased">
        <CursorEffect />
        {children}
      </body>
    </html>
  );
}
