import type { Metadata, Viewport } from "next";
import "./globals.css";

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

export const viewport: Viewport = {
  themeColor: "#FBF9F9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-[family-name:var(--font-body)]">
        {children}
      </body>
    </html>
  );
}
