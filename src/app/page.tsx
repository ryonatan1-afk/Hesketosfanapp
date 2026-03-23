"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";
import InstallBanner from "@/components/InstallBanner";
import { trackEvent } from "@/lib/analytics";

const tiles = [
  { emoji: "🔊", label: "לוּחַ צְלִילִים", href: "/soundboard", bg: "bg-pink-400"   },
  { emoji: "🧩", label: "חִידוֹן",         href: "/quiz",       bg: "bg-blue-400"   },
  { emoji: "🎨", label: "יְצִירָה",        href: "/draw",       bg: "bg-green-400"  },
  { emoji: "🖼️", label: "גַּלֶרְיָה",      href: "/gallery",    bg: "bg-purple-400" },
];

const DISCLAIMER =
  "אתר זה הוא מיזם מעריצים עצמאי ואינו אתר רשמי של יוצרי הפודקאסט 'הסכתוס'. האתר הוקם ללא כוונת רווח, מתוך אהבה לתוכן וכדי להעניק ערך מוסף לקהילת המאזינים. כל זכויות היוצרים שייכות לבעליהם המקוריים. נוצר ע\"י אבא של תום ומיקה.";

export default function HomePage() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <div className="min-h-screen bg-blue flex flex-col items-center justify-center gap-6 p-6 relative overflow-hidden">
      <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />
      <InstallBanner />

      {/* Info icon — top-left corner */}
      <button
        onClick={() => { setShowDisclaimer(true); trackEvent("disclaimer_open"); }}
        aria-label="אודות האתר"
        className="absolute top-4 left-4 text-white/50 hover:text-white/90 transition-colors"
      >
        <Info size={20} />
      </button>

      <h1 className="text-white text-4xl font-black text-center leading-snug">הסכתוס<br /><span className="text-2xl font-bold opacity-80">אֲתַר הַמַּעֲרִיצִים הַלֹּא רַשְׁמִי</span></h1>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.href}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 18 }}
            whileTap={{ scale: 0.9 }}
          >
            <Link
              href={tile.href}
              onClick={() => trackEvent("tile_click", { tile: tile.href.replace("/", "") })}
              className={`${tile.bg} rounded-3xl shadow-xl flex flex-col items-center justify-center gap-3 aspect-square w-full`}
            >
              <span className="text-6xl">{tile.emoji}</span>
              <span className="text-white text-2xl font-black">{tile.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      <a
        href={`https://wa.me/?text=${encodeURIComponent("🎙️ הסכתוס - אתר המעריצים!\nחִידוֹנִים, יְצִירָה, לוּחַ צְלִילִים וְגַלֶרְיָה לְכָל הַכִּיתָה ✨\nhttps://hesketosfanapp.vercel.app")}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("whatsapp_share_click")}
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white font-black text-lg px-8 py-4 rounded-3xl shadow-lg"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        שַׁתְּפוּ עִם הַכִּיתָה
      </a>

      <a
        href="mailto:hesketosfanapp@gmail.com"
        onClick={() => trackEvent("feedback_click")}
        className="text-white/70 text-sm font-bold underline underline-offset-4 pb-4"
      >
        ✉️ שִׁלְחוּ פִידְבַּק
      </a>

      {/* Disclaimer modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDisclaimer(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl p-6 z-50 max-w-sm mx-auto"
            >
              <p className="text-ink text-base leading-relaxed text-right">
                {DISCLAIMER}
              </p>
              <button
                onClick={() => { setShowDisclaimer(false); trackEvent("disclaimer_close"); }}
                className="mt-6 w-full bg-ink text-white font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                <X size={18} />
                סְגוֹר
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
