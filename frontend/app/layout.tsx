import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";  // <--- THIS LINE IS MANDATORY

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NexusRetail AI",
  description: "Enterprise ERP & POS System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}