import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "הסכתוס",
  description: "פודקאסט לילדים",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-ink antialiased font-sans">
        <main className="flex-1 overflow-y-auto pb-24">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
