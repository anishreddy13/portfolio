import type { Metadata, Viewport } from "next";
import "../globals.css";
import PlatformShell from "@/components/PlatformShell";
import { ThemeProvider } from "@/context/ThemeContext";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.anishreddy.online"),
  icons: {
    icon: "/favicon.svg",
  },
  title: "Anish Reddy — AI Researcher",
  description:
    "AI Researcher & Engineer crafting intelligent systems, machine learning pipelines, and multi-agent frameworks.",
  keywords: [
    "AI Researcher",
    "Machine Learning",
    "AI Engineer",
    "Deep Learning",
    "PyTorch",
    "Portfolio",
    "Next.js",
  ],
  authors: [
    {
      name: "Anish Reddy",
      url: "https://www.anishreddy.online",
    },
  ],
  creator: "Anish Reddy",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Anish Reddy — AI Researcher",
    description:
      "AI Researcher & Engineer crafting intelligent systems and machine learning pipelines.",
    type: "website",
    url: "https://www.anishreddy.online",
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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
