"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";
import InstallBanner from "@/components/InstallBanner";
import { trackEvent } from "@/lib/analytics";
import { getCoins, COINS_EVENT } from "@/lib/coins";
import styles from "./HomePage.module.css";

const DISCLAIMER =
  'אתר זה הוא מיזם מעריצים עצמאי ואינו אתר רשמי של יוצרי הפודקאסט \'הסכתוס\'. האתר הוקם ללא כוונת רווח, מתוך אהבה לתוכן וכדי להעניק ערך מוסף לקהילת המאזינים. כל זכויות היוצרים שייכות לבעליהם המקוריים. נוצר ע"י אבא של תום ומיקה.';

const CARDS = [
  { emoji: "🔊", label: "לוּחַ צְלִילִים",       href: "/soundboard", cls: styles.card1, wiggleDelay: "0s",   cardDelay: "0.55s" },
  { emoji: "🧩", label: "חִידּוֹן",              href: "/quiz",       cls: styles.card2, wiggleDelay: "0.4s", cardDelay: "0.65s" },
  { emoji: "🎨", label: "יְצִירָה",              href: "/draw",       cls: styles.card3, wiggleDelay: "0.8s", cardDelay: "0.75s" },
  { emoji: "🎙️", label: "פּוֹדְקַאסְט",          href: "/podcast",    cls: styles.card4, wiggleDelay: "1.2s", cardDelay: "0.85s" },
  { emoji: "🎮", label: "מִשְׂחָקִים",            href: "/games",      cls: styles.card5, wiggleDelay: "1.6s", cardDelay: "0.95s" },
  { emoji: "👑", label: "מֶלֶךְ הַטְּרִיוִויָה", href: "/trivia",     cls: styles.card6, wiggleDelay: "2s",   cardDelay: "1.05s", isNew: true },
];

type Star = { id: number; left: number; top: number; size: number; dur: number; delay: number };

export default function HomePage() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [coins, setCoins] = useState(0);
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    setStars(Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left:  Math.random() * 100,
      top:   Math.random() * 100,
      size:  4 + Math.random() * 6,
      dur:   2 + Math.random() * 3,
      delay: Math.random() * 4,
    })));
  }, []);

  useEffect(() => {
    setCoins(getCoins());
    function onCoins(e: Event) { setCoins((e as CustomEvent<number>).detail); }
    window.addEventListener(COINS_EVENT, onCoins);
    return () => window.removeEventListener(COINS_EVENT, onCoins);
  }, []);

  return (
    <div className={styles.page}>
      <InstallBanner />

      {/* Twinkling stars */}
      <div className={styles.stars}>
        {stars.map((s) => (
          <div
            key={s.id}
            style={{
              position: "absolute",
              borderRadius: "50%",
              background: "#f9c74f",
              left: `${s.left}%`,
              top:  `${s.top}%`,
              width:  `${s.size}px`,
              height: `${s.size}px`,
              opacity: 0,
              animation: `twinkle ${s.dur.toFixed(2)}s ease-in-out infinite ${s.delay.toFixed(2)}s`,
            }}
          />
        ))}
      </div>

      {/* Info button */}
      <button
        className={styles.infoBtn}
        onClick={() => { setShowDisclaimer(true); trackEvent("disclaimer_open"); }}
        aria-label="אוֹדוֹת הָאֲתַר"
      >
        <Info size={18} />
      </button>

      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.badge}>⭐ אֲתַר הַמַּעֲרִיצִים הַלֹּא רַשְׁמִי</div>
        <span className={styles.mascot}>🎙️</span>
        <h1 className={styles.heroTitle}>
          <span className={styles.heroTitleGradient}>הֶסְכֵּתוֹס</span>
        </h1>
        <p className={styles.heroSub}>בּוֹאוּ נִרְאֶה מַה עָשִׂינוּ יַחַד!</p>
        {coins > 0 && (
          <p className={styles.coins}>🪙 {coins} מַטְבְּעוֹת</p>
        )}
      </header>

      <p className={styles.sectionLabel}>מַה רוֹצִים לַעֲשׂוֹת?</p>

      {/* Card grid */}
      <nav className={styles.grid} aria-label="נִיּוּט רָאשִׁי">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            onClick={() => trackEvent("tile_click", { tile: card.href.replace("/", "") })}
            className={`${styles.card} ${card.cls}`}
            style={{ "--card-delay": card.cardDelay } as React.CSSProperties}
          >
            {card.isNew && <div className={styles.newDot} />}
            <span
              className={styles.cardIcon}
              style={{ "--wiggle-delay": card.wiggleDelay } as React.CSSProperties}
            >
              {card.emoji}
            </span>
            <span className={styles.cardLabel}>{card.label}</span>
          </Link>
        ))}
      </nav>

      {/* Share strip */}
      <div className={styles.shareStrip}>
        <div className={styles.shareText}>
          אֲהַבְתֶּם? שַׁתְּפוּ אֶת זֶה 🥳
          <small className={styles.shareTextSmall}>שַׁתְּפוּ עִם הַחֲבֵרִים!</small>
        </div>
        <a
          href={`https://wa.me/?text=${encodeURIComponent("🎙️ הסכתוס - אתר המעריצים!\nחִידוֹנִים, יְצִירָה, פּוֹדְקַאסְט וְלוּחַ צְלִילִים לְכָל הַכִּיתָה ✨\nhttps://hesketosfanapp.vercel.app")}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("whatsapp_share_click")}
          className={styles.shareBtn}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          שַׁתֵּף
        </a>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <a
          href="mailto:hesketosfanapp@gmail.com"
          onClick={() => trackEvent("feedback_click")}
          className={styles.feedbackLink}
        >
          ✉️ שִׁלְחוּ פִידְבַּק
        </a>
        <p className={styles.footerNote}>אֲתַר מַעֲרִיצִים לֹא רַשְׁמִי · אֵין קֶשֶׁר לְיוֹצְרֵי הֶסְכֵּתוֹס</p>
      </footer>

      {/* Disclaimer modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDisclaimer(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl p-6 z-50 max-w-sm mx-auto"
            >
              <p className="text-ink text-base leading-relaxed text-right">{DISCLAIMER}</p>
              <button
                onClick={() => { setShowDisclaimer(false); trackEvent("disclaimer_close"); }}
                className="mt-6 w-full bg-ink text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2"
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
