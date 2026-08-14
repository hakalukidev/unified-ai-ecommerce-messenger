import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khoroch | Unified Inbox",
  description: "Unified inbox for Facebook, Instagram, and WhatsApp sellers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--color-background)] text-[var(--color-foreground)]">
        {children}
      </body>
    </html>
  );
}
