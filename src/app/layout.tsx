import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { getUserTheme } from "@/lib/auth-utils";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Freelancer CRM - All-in-One Business Workspace",
  description: "Manage clients, track projects, organize tasks, and generate professional invoices in one central SaaS platform.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = await getUserTheme();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full ${theme === "dark" ? "dark" : ""}`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
        </body>
    </html>
  );
}
