"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BottomNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <AnimatePresence>
      {!isHome && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none"
        >
          <motion.div whileTap={{ scale: 0.85 }} className="pointer-events-auto">
            <Link
              href="/"
              className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center"
            >
              <Home size={28} className="text-ink" strokeWidth={2.5} />
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
