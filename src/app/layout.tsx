import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const tajawal = localFont({
  variable: "--font-tajawal",
  display: "swap",
  fallback: ["Noto Sans Arabic", "sans-serif"],
  src: [
    {
      path: "../../public/fonts/tajawal-arabic-300-normal.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/tajawal-arabic-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/tajawal-arabic-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/tajawal-arabic-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/tajawal-arabic-800-normal.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/tajawal-latin-300-normal.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/tajawal-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/tajawal-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/tajawal-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/tajawal-latin-800-normal.woff2",
      weight: "800",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "Future English Portal",
  description: "Operational student registration platform for Future English",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
