"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

const EMOJIS = ["🎙️", "🌴", "🧲", "🍆", "🍲", "🧹", "🏔️", "🛸", "🧙", "🎵"];

const DIFFICULTIES = {
  easy:   { label: "קַל",    cols: 4, pairs: 6,  multiplier: 1 },
  medium: { label: "בֵּינוֹנִי", cols: 4, pairs: 8,  multiplier: 2 },
  hard:   { label: "קָשֶׁה",  cols: 5, pairs: 10, multiplier: 3 },
} as const;

type Difficulty = keyof typeof DIFFICULTIES;

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  difficulty: Difficulty;
}

function calcScore(pairs: number, multiplier: number, moves: number): number {
  return Math.round((pairs * multiplier * 10) / moves);
}

const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  easy: "קַל",
  medium: "בֵּינוֹנִי",
  hard: "קָשֶׁה",
};

export default function MemoryGame() {
  const [tab, setTab] = useState<"game" | "leaderboard">("game");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [won, setWon] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);

  const fetchScores = useCallback(async () => {
    setLoadingScores(true);
    try {
      const res = await fetch("/api/memory/scores");
      const data = await res.json();
      setScores(data);
    } finally {
      setLoadingScores(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "leaderboard") fetchScores();
  }, [tab, fetchScores]);

  function startGame(diff: Difficulty) {
    const { pairs } = DIFFICULTIES[diff];
    const pool = EMOJIS.slice(0, pairs);
    const deck = [...pool, ...pool]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setDifficulty(diff);
    setCards(deck);
    setFlipped([]);
    setMoves(0);
    setMatched(0);
    setWon(false);
    setSubmitted(false);
    setPlayerName("");
    trackEvent("memory_start", { difficulty: diff });
  }

  function handleFlip(id: number) {
    if (flipped.length === 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newFlipped = [...flipped, id];
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)));
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [a, b] = newFlipped.map((fid) => cards.find((c) => c.id === fid)!);
      const newMoves = moves + 1;
      setMoves(newMoves);

      if (a.emoji === b.emoji) {
        const newMatched = matched + 1;
        setCards((prev) =>
          prev.map((c) => (c.id === a.id || c.id === b.id ? { ...c, matched: true } : c))
        );
        setMatched(newMatched);
        setFlipped([]);
        const { pairs } = DIFFICULTIES[difficulty!];
        if (newMatched === pairs) {
          setWon(true);
          trackEvent("memory_win", { difficulty, moves: newMoves, score: calcScore(pairs, DIFFICULTIES[difficulty!].multiplier, newMoves) });
        }
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c
            )
          );
          setFlipped([]);
        }, 900);
      }
    }
  }

  async function submitScore() {
    if (!playerName.trim() || !difficulty) return;
    setSubmitting(true);
    const { pairs, multiplier } = DIFFICULTIES[difficulty];
    const score = calcScore(pairs, multiplier, moves);
    try {
      await fetch("/api/memory/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playerName.trim(), score, difficulty }),
      });
      setSubmitted(true);
      trackEvent("memory_score_submitted", { difficulty, score });
    } finally {
      setSubmitting(false);
    }
  }

  const cfg = difficulty ? DIFFICULTIES[difficulty] : null;
  const score = won && cfg ? calcScore(cfg.pairs, cfg.multiplier, moves) : 0;

  return (
    <div className="flex flex-col items-center w-full px-4 pb-24">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-[#1a1a2e]/10 rounded-2xl p-1 w-full max-w-xs">
        {(["game", "leaderboard"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-base font-black transition-colors ${
              tab === t ? "bg-[#1a1a2e] text-white" : "text-[#1a1a2e]/60"
            }`}
          >
            {t === "game" ? "🧠 מִשְׂחָק" : "🏆 טוֹפ 10"}
          </button>
        ))}
      </div>

      {tab === "game" && (
        <>
          {/* Difficulty picker */}
          {!difficulty && (
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <p className="text-center text-[#1a1a2e] text-2xl font-black mb-2">בְּחַר רָמָה</p>
              {(Object.entries(DIFFICULTIES) as [Difficulty, typeof DIFFICULTIES[Difficulty]][]).map(([key, d]) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startGame(key)}
                  className="rounded-2xl py-5 text-white text-2xl font-black shadow-lg"
                  style={{
                    background:
                      key === "easy" ? "linear-gradient(135deg,#4ade80,#22c55e)" :
                      key === "medium" ? "linear-gradient(135deg,#fbbf24,#f59e0b)" :
                      "linear-gradient(135deg,#f87171,#ef4444)",
                    boxShadow: "0 4px 0 rgba(0,0,0,0.15)",
                  }}
                >
                  {d.label} — {d.pairs * 2} קַלְפִּים
                </motion.button>
              ))}
            </div>
          )}

          {/* Game board */}
          {difficulty && !won && (
            <>
              <div className="flex justify-between w-full max-w-sm mb-4 items-center">
                <button
                  onClick={() => setDifficulty(null)}
                  className="text-[#1a1a2e]/50 text-sm font-bold"
                >
                  ← חֲזָרָה
                </button>
                <span className="text-[#1a1a2e] font-black text-lg">
                  מַהֲלָכִים: {moves}
                </span>
              </div>
              <div
                className="grid gap-2 w-full max-w-sm"
                style={{ gridTemplateColumns: `repeat(${cfg!.cols}, 1fr)` }}
              >
                {cards.map((card) => (
                  <motion.button
                    key={card.id}
                    onClick={() => handleFlip(card.id)}
                    whileTap={{ scale: 0.92 }}
                    className="aspect-square rounded-xl text-3xl flex items-center justify-center shadow"
                    style={{
                      background: card.flipped || card.matched
                        ? card.matched ? "#bbf7d0" : "#fef9c3"
                        : "linear-gradient(135deg,#a78bfa,#7c3aed)",
                    }}
                    animate={{ rotateY: card.flipped || card.matched ? 0 : 180 }}
                    transition={{ duration: 0.25 }}
                  >
                    {(card.flipped || card.matched) ? card.emoji : ""}
                  </motion.button>
                ))}
              </div>
            </>
          )}

          {/* Win screen */}
          {won && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4 w-full max-w-xs text-center mt-4"
            >
              <div className="text-6xl">🎉</div>
              <p className="text-[#1a1a2e] text-3xl font-black">כָּל הַכָּבוֹד!</p>
              <p className="text-[#1a1a2e]/70 text-lg font-bold">{moves} מַהֲלָכִים</p>
              <div className="bg-[#1a1a2e] text-white rounded-2xl px-8 py-4 w-full">
                <p className="text-sm font-bold opacity-60 mb-1">הַנִּיקּוּד שֶׁלְּךָ</p>
                <p className="text-5xl font-black">{score.toLocaleString()}</p>
              </div>

              {!submitted ? (
                <div className="flex flex-col gap-3 w-full">
                  <input
                    type="text"
                    placeholder="שֵׁם לַלּוּחַ הַטּוֹפ..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={20}
                    className="border-2 border-[#1a1a2e]/20 rounded-xl px-4 py-3 text-center text-lg font-bold bg-white outline-none focus:border-[#1a1a2e]/50"
                  />
                  <button
                    onClick={submitScore}
                    disabled={submitting || !playerName.trim()}
                    className="bg-[#1a1a2e] text-white rounded-xl py-3 text-lg font-black disabled:opacity-40"
                  >
                    {submitting ? "שׁוֹלֵחַ..." : "שְׁלַח נִיקּוּד 🏆"}
                  </button>
                </div>
              ) : (
                <p className="text-green-600 font-black text-lg">✓ הַנִּיקּוּד נִשְׁמַר!</p>
              )}

              <button
                onClick={() => setDifficulty(null)}
                className="text-[#1a1a2e]/60 font-bold text-base underline"
              >
                שְׂחַק שׁוּב
              </button>
            </motion.div>
          )}
        </>
      )}

      {tab === "leaderboard" && (
        <div className="w-full max-w-sm">
          {loadingScores ? (
            <p className="text-center text-[#1a1a2e]/50 font-bold mt-8">טוֹעֵן...</p>
          ) : scores.length === 0 ? (
            <p className="text-center text-[#1a1a2e]/50 font-bold mt-8">עֲדַיִן אֵין תּוֹצָאוֹת — הֱיֵה רִאשׁוֹן!</p>
          ) : (
            <div className="flex flex-col gap-2">
              {scores.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm"
                >
                  <span className="text-2xl font-black w-8 text-center text-[#1a1a2e]/40">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <span className="flex-1 font-black text-[#1a1a2e] text-lg truncate">{s.name}</span>
                  <span className="text-xs font-bold text-white bg-[#1a1a2e]/30 rounded-full px-2 py-0.5">
                    {DIFFICULTY_BADGE[s.difficulty]}
                  </span>
                  <span className="font-black text-[#1a1a2e] text-lg">{s.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
