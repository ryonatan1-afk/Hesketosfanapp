"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  return (
    <AnimatePresence>
      {!isHome && (
        <motion.nav
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-4"
        >
          {/* Back — right side in RTL */}
          <button
            onClick={() => {
              trackEvent("back_button_clicked", { from_page: pathname });
              router.back();
            }}
            aria-label="חֲזוֹר"
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-black/20 text-white backdrop-blur-sm"
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>

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
