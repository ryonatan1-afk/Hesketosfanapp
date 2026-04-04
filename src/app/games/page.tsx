"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const games = [
  { emoji: "🎮", label: "חַזְרוּ אַחֲרַי!", description: "מִשְׂחַק זִכָּרוֹן — חִזְרוּ עַל הַסֵּדֶר!", href: "/games/simon",        gradient: "linear-gradient(135deg,#ff6b6b,#e84393)" },
  { emoji: "🧙‍♀️", label: "הַמְּכַשֵּׁפָה הַרָּצָה", description: "אֱסֹף קִישׁוּאִים — הִמָּנַע מִפֶּטְרוֹזִילְיוֹן!", href: "/games/witch-runner", gradient: "linear-gradient(135deg,#a78bfa,#ec4899)" },
  { emoji: "🧠", label: "זִכָּרוֹן",             description: "מִצְאוּ זוּגוֹת — 3 רָמוֹת קֹשִׁי!",              href: "/games/memory",      gradient: "linear-gradient(135deg,#34d399,#059669)" },
];

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-[#fef6e4] flex flex-col relative overflow-hidden">
      <div className="flex flex-col items-center pt-10 pb-4 px-6 text-center">
        <h1 className="text-[#1a1a2e] text-5xl font-black leading-tight">מִשְׂחָקִים</h1>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-8 mt-2">
        {games.map((game, i) => (
          <motion.div
            key={game.href}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 18 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href={game.href}
              className="rounded-3xl shadow-xl flex flex-col items-center justify-center gap-2 w-full py-10"
              style={{ background: game.gradient, boxShadow: "0 5px 0 rgba(0,0,0,0.15)" }}
            >
              <span className="text-7xl">{game.emoji}</span>
              <span className="text-white text-3xl font-black">{game.label}</span>
              <span className="text-white/80 text-base font-bold">{game.description}</span>
            </Link>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-[#1a1a2e]/5 rounded-3xl px-6 py-5 text-center"
        >
          <p className="text-[#1a1a2e] text-xl font-bold">עוֹד מִשְׂחָקִים בַּדֶּרֶךְ... 🚀</p>
          <p className="text-gray-500 text-base mt-1">הִישָּׁאֲרוּ מְחוּבָּרִים!</p>
        </motion.div>
      </div>
    </div>
  );
}
