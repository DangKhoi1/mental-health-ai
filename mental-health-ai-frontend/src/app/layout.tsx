import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { Toaster } from '@/components/ui/sonner';
import { Chatbot } from '@/components/chatbot/Chatbot';
import { MusicPlayer } from "@/components/shared/MusicPlayer";
import { FloatingActionMenu } from "@/components/shared/FloatingActionMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mental Health AI",
  description: "Mental Health AI",
  icons: {
    icon: "/mental_health.png",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
        <Chatbot />
        <FloatingActionMenu />
      </body>
    </html>
  );
}
