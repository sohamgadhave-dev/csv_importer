import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "GrowEasy CSV Importer — AI-Powered CRM Data Import",
  description:
    "Import CSV files with any column structure. AI intelligently maps fields to your CRM schema, validates data, and exports clean records.",
  keywords: ["CSV importer", "CRM", "AI", "data import", "lead management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <div className="gradient-bg min-h-screen">
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
