import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FounderMatch – Dating für Unternehmer",
  description: "Exklusives Dating für Unternehmer und ambitionierte Singles. Kuratierte Matches nach Werten, Zukunftsplänen und echter Kompatibilität.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FounderMatch",
  },
  openGraph: {
    title: "FounderMatch – Dating für Unternehmer",
    description: "Keine endlosen Swipes. Nur kuratierte Matches für ambitionierte Singles.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#d97706" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
