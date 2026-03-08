import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthGuard from "@/components/auth/auth-guard";
import { AuthProvider } from "@/contexts/AuthContext";
import { CsrfProvider } from "@/contexts/CsrfContext";
import { QueryProvider } from "@/contexts/QueryProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "All Mart Admin Portal",
  description: "Enterprise-level admin dashboard",
};

// Split the layout into server and client components
function RootLayoutClient({ children }: { children: React.ReactNode }) {
  'use client';
  
  return (
    <QueryProvider>
      <AuthProvider>
        <CsrfProvider>
          <ThemeProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </CsrfProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
