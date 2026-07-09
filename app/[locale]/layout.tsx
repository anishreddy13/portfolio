import type { Metadata } from "next";
import "../globals.css";
import PlatformShell from "@/components/PlatformShell";
import { ThemeProvider } from "@/context/ThemeContext";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

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

export default async function RootLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
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
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <PlatformShell>{children}</PlatformShell>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}