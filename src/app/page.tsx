"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import InstallBanner from "@/components/InstallBanner";

const tiles = [
  { emoji: "🔊", label: "לוּחַ צְלִילִים", href: "/soundboard", bg: "bg-pink-400"   },
  { emoji: "🧩", label: "חִידוֹן",         href: "/quiz",       bg: "bg-blue-400"   },
  { emoji: "🎨", label: "יְצִירָה",        href: "/draw",       bg: "bg-green-400"  },
  { emoji: "🖼️", label: "גַּלֶרְיָה",      href: "/gallery",    bg: "bg-purple-400" },
];

export default function HomePage() {
  return (
    <div className="min-h-[80vh] bg-blue flex flex-col items-center justify-center gap-6 p-6 relative overflow-hidden">
      <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />
      <InstallBanner />

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
    </div>
  );
}
