import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import TopNav from "@/components/TopNav";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["400", "700", "900"],
});

const BASE_URL = "https://hesketosfanapp.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "הסכתוס — אתר המעריצים",
    template: "%s | הסכתוס",
  },
  description:
    "אתר המעריצים הלא רשמי של הסכתוס — פודקאסט לילדים. חידונים, לוח צלילים, יצירה וגלריה לכל הכיתה!",
  keywords: ["הסכתוס", "פודקאסט ילדים", "חידון", "לוח צלילים", "להיטוס", "ילדים"],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: BASE_URL,
    siteName: "הסכתוס",
    title: "הסכתוס — אתר המעריצים",
    description:
      "חידונים, לוח צלילים, יצירה וגלריה — כל הכיף של הסכתוס במקום אחד!",
    images: [{ url: "/icons/icon.jpg", width: 512, height: 512, alt: "הסכתוס" }],
  },
  twitter: {
    card: "summary",
    title: "הסכתוס — אתר המעריצים",
    description: "חידונים, לוח צלילים, יצירה וגלריה לכל הכיתה!",
    images: ["/icons/icon.jpg"],
  },
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
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
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
        <Script
          id="posthog-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group identify setPersonProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags resetGroups onFeatureFlags addFeatureFlagsHandler onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init('phc_XVNABpRXn6gxTbI8NwtBaXSlDdShOVFCIMwq9Ic8EeM',{api_host:'https://eu.i.posthog.com',defaults:'2026-01-30'})`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-blue text-ink antialiased font-sans">
        <TopNav />
        <main className="flex-1 overflow-y-auto pt-14">{children}</main>
      </body>
    </html>
  );
}
