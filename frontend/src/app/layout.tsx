import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "C(AI)DENCE | AI Marketing Intelligence",
  description: "Autonomous marketing campaigns and content generation.",
};

import { PreferencesProvider } from "@/context/PreferencesContext";
import { PermissionProvider } from "@/contexts/PermissionContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased`}
      >
        <PreferencesProvider>
          <PermissionProvider>
            {children}
            <Toaster />
          </PermissionProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}

import { Toaster } from "sonner";
