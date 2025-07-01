import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "እዳ Tracker - Track Your Lending & Borrowing",
  description: "Keep track of money you've lent to friends and family. Simple, secure, and easy-to-use expense tracking for personal lending in Ethiopian Birr (ETB).",
  keywords: ["expense tracker", "lending", "borrowing", "money tracker", "ETB", "Ethiopian Birr", "personal finance", "እዳ"],
  authors: [{ name: "እዳ Tracker" }],
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "እዳ Tracker - Track Your Lending & Borrowing",
    description: "Keep track of money you've lent to friends and family. Simple, secure, and easy-to-use expense tracking for personal lending in Ethiopian Birr (ETB).",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "እዳ Tracker - Track Your Lending & Borrowing",
    description: "Keep track of money you've lent to friends and family. Simple, secure, and easy-to-use expense tracking for personal lending in Ethiopian Birr (ETB).",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
