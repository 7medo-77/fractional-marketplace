import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Toaster } from "@/components/ui/sonner";
import { UserIdInitializer } from "@/components/shared/UserIdInitializer";
import { SocketNotificationsBridge } from '@/components/socket/SocketNotificationsBridge';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Fractional Marketplace",
  description: "Trade fractional ownership of high-value assets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
          <Footer />
        </div>
        <Toaster position="top-right" />
        <UserIdInitializer />
        <SocketNotificationsBridge />
      </body>
    </html>
  );
}
