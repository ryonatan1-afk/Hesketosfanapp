"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const games = [
  { emoji: "🎮", label: "חַזְרוּ אַחֲרַי!", description: "מִשְׂחַק זִכָּרוֹן — חִזְרוּ עַל הַסֵּדֶר!", href: "/games/simon", bg: "bg-pink-400" },
  { emoji: "🧙‍♀️", label: "הַמְּכַשֵּׁפָה הַרָּצָה", description: "אֱסֹף קִישׁוּאִים — הִמָּנַע מִפֶּטְרוֹזִילְיוֹן!", href: "/games/witch-runner", bg: "bg-purple-500" },
];

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-teal-500 flex flex-col relative overflow-hidden">
      <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />

      <div className="flex flex-col items-center pt-10 pb-4 px-6 text-center">
        <h1 className="text-white text-5xl font-black leading-tight">מִשְׂחָקִים</h1>
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
              className={`${game.bg} rounded-3xl shadow-xl flex flex-col items-center justify-center gap-2 w-full py-10`}
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
          className="bg-white/15 rounded-3xl px-6 py-5 text-center"
        >
          <p className="text-white text-xl font-bold">עוֹד מִשְׂחָקִים בַּדֶּרֶךְ... 🚀</p>
          <p className="text-white/70 text-base mt-1">הִישָּׁאֲרוּ מְחוּבָּרִים!</p>
        </motion.div>
      </div>
    </div>
  );
}
