import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AI Video TransStudio",
  description: "Upload video và tạo phụ đề dịch tự động bằng AI. Hỗ trợ Double Subtitle, AI Dubbing và xuất file SRT.",
  keywords: ["AI", "video", "phụ đề", "dịch thuật", "subtitle", "translation"],
  authors: [{ name: "AI Video TransStudio" }],
  openGraph: {
    title: "AI Video TransStudio",
    description: "Studio dịch video thông minh bằng AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
