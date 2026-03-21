"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";
import InstallBanner from "@/components/InstallBanner";

const tiles = [
  { emoji: "🔊", label: "לוּחַ צְלִילִים", href: "/soundboard", bg: "bg-pink-400"   },
  { emoji: "🧩", label: "חִידוֹן",         href: "/quiz",       bg: "bg-blue-400"   },
  { emoji: "🎨", label: "יְצִירָה",        href: "/draw",       bg: "bg-green-400"  },
  { emoji: "🖼️", label: "גַּלֶרְיָה",      href: "/gallery",    bg: "bg-purple-400" },
];

const DISCLAIMER =
  "אתר זה הוא מיזם מעריצים עצמאי ואינו אתר רשמי של יוצרי הפודקאסט 'הסכתוס'. האתר הוקם ללא כוונת רווח, מתוך אהבה לתוכן וכדי להעניק ערך מוסף לקהילת המאזינים. כל זכויות היוצרים שייכות לבעליהם המקוריים.";

export default function HomePage() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <div className="min-h-[80vh] bg-blue flex flex-col items-center justify-center gap-6 p-6 relative overflow-hidden">
      <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />
      <InstallBanner />

      {/* Info icon — top-left corner */}
      <button
        onClick={() => setShowDisclaimer(true)}
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
              className={`${tile.bg} rounded-3xl shadow-xl flex flex-col items-center justify-center gap-3 aspect-square w-full`}
            >
              <span className="text-6xl">{tile.emoji}</span>
              <span className="text-white text-2xl font-black">{tile.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      <a
        href="mailto:hesketosfanapp@gmail.com"
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
                onClick={() => setShowDisclaimer(false)}
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
