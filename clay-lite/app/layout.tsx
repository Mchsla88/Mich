import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clay LITE - Lead Enrichment Platform",
  description: "Affordable lead enrichment with AI-powered research using Gemini",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
