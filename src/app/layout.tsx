import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import Script from "next/script";
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "הסכתוס",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#68B8ED" />
        <link rel="apple-touch-icon" href="/icons/icon.jpg" />
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}`,
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FCZNQQNJBT"
          strategy="afterInteractive"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-FCZNQQNJBT');`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-ink antialiased font-sans">
        <main className="flex-1 overflow-y-auto pb-24">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
