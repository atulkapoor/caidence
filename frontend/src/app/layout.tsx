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
  title: "C(AI)DENCE | AI Marketing Intelligence",
  description: "Autonomous marketing campaigns and content generation.",
};

import { PreferencesProvider } from "@/context/PreferencesContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PreferencesProvider>
          {children}
          <Toaster />
        </PreferencesProvider>
      </body>
    </html>
  );
}

import { Toaster } from "sonner";
