import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../../global.css";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased 
                    bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
