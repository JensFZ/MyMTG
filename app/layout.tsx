import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteShell } from "@/components/site-shell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyMTG Deckverwaltung",
  description: "Lokale Magic: The Gathering Deck- und Kartenverwaltung",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark">
      <body className={inter.className}>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
