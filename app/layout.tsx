import type { Metadata } from "next";
import "./globals.css";
import PlatformShell from "@/components/PlatformShell";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Anish.Dev – Full Stack Developer",
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
    title: "Anish.Dev – Full Stack Developer",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="color-scheme" content="dark" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('anish-theme');
              if (!theme) {
                theme = window.matchMedia('(prefers-color-scheme: dark)').matches
                  ? 'dark' : 'light';
              }
              document.documentElement.classList.add(theme);
            } catch(e) {
              document.documentElement.classList.add('dark');
            }
          })();
        `}} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <PlatformShell>{children}</PlatformShell>
        </ThemeProvider>
      </body>
    </html>
  );
}