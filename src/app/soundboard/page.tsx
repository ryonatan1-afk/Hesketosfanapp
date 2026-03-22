"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2 } from "lucide-react";
import confetti from "canvas-confetti";
import { trackEvent } from "@/lib/analytics";

interface Sound {
  file: string;
  label: string;
  bg: string;
  emoji: string | null;
}

const sounds: Sound[] = [
  { file: "AtKishu.mp3",      label: "את קישוא",       bg: "bg-orange-400", emoji: "🍆" },
  { file: "ichsikichsi.mp3",  label: "איכסי קיסכי",    bg: "bg-sky-400",    emoji: "🤮" },
  { file: "lahitos.mp3",      label: "להיטוס!",         bg: "bg-pink-400",   emoji: null },
  { file: "noobemet.mp3",     label: "נו באמת!",        bg: "bg-lime-400",   emoji: "😱" },
  { file: "sawadikastav.mp3", label: "סוואדיקא סתיו",  bg: "bg-yellow-400", emoji: "🙏" },
];

function fireConfetti() {
  const defaults = { zIndex: 9999 };
  confetti({ ...defaults, angle: 60,  spread: 80, particleCount: 150, origin: { x: 0, y: 0.5 } });
  confetti({ ...defaults, angle: 120, spread: 80, particleCount: 150, origin: { x: 1, y: 0.5 } });
}

export default function SoundboardPage() {
  const audiosRef = useRef<HTMLAudioElement[]>([]);
  const [emojiKey, setEmojiKey] = useState(0);
  const [activeEmoji, setActiveEmoji] = useState<string | null>(null);

function playSound(file: string) {
    const audio = new Audio(`/soundboard/${file}`);
    audiosRef.current.push(audio);
    audio.play();
    audio.onended = () => {
      audiosRef.current = audiosRef.current.filter((a) => a !== audio);
    };

    if (file === "lahitos.mp3") fireConfetti();

    const sound = sounds.find((s) => s.file === file);
    trackEvent("sound_played", { sound_name: sound?.label ?? file });
    if (sound?.emoji) {
      setActiveEmoji(sound.emoji);
      setEmojiKey((k) => k + 1);
      setTimeout(() => setActiveEmoji(null), 1200);
    }
  }

  return (
    <div className="min-h-screen bg-lavender flex flex-col relative overflow-hidden">
      <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />

      {/* Emoji overlay */}
      <AnimatePresence>
        {activeEmoji && (
          <motion.div
            key={emojiKey}
            initial={{ scale: 0.2, opacity: 1 }}
            animate={{ scale: 6, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <span className="text-[80px] leading-none">{activeEmoji}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-2 px-6 text-center">
<h1 className="text-white text-5xl font-black leading-tight mt-1">לוּחַ צְלִילִים</h1>
      </div>

{/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-28">
        {sounds.map((sound, i) => (
          <motion.button
            key={sound.file}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 18 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => playSound(sound.file)}
            className={`${sound.bg} rounded-3xl shadow-xl aspect-square flex flex-col items-center justify-center gap-3 p-4`}
          >
            <Volume2 size={36} className="text-white drop-shadow" strokeWidth={2.5} />
            <span className="text-white text-xl font-black text-center leading-tight drop-shadow">
              {sound.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
