"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { useState, useEffect } from "react";
import { getCoins, COINS_EVENT } from "@/lib/coins";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    setCoins(getCoins());
    function onCoins(e: Event) {
      setCoins((e as CustomEvent<number>).detail);
    }
    window.addEventListener(COINS_EVENT, onCoins);
    return () => window.removeEventListener(COINS_EVENT, onCoins);
  }, [pathname]);

  return (
    <AnimatePresence>
      {!isHome && (
        <motion.nav
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-4 bg-white/10 backdrop-blur-md"
        >
          {/* Back — right side in RTL */}
          <button
            onClick={() => {
              trackEvent("back_button_clicked", { from_page: pathname });
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            aria-label="חֲזוֹר"
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-black/20 text-white backdrop-blur-sm"
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>

          {/* Coin balance — center */}
          {coins > 0 && (
            <span className="px-3 py-1 rounded-2xl bg-black/20 text-white text-sm font-bold backdrop-blur-sm">
              🪙 {coins}
            </span>
          )}

          {/* Home — left side in RTL */}
          <Link
            href="/"
            onClick={() => trackEvent("home_button_clicked", { from_page: pathname })}
            aria-label="עַמּוּד בַּיִת"
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-black/20 text-white backdrop-blur-sm"
          >
            <Home size={20} strokeWidth={2.5} />
          </Link>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
