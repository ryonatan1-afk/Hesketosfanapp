"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Volume2, VolumeX, Loader2 } from "lucide-react";

interface SimonSound {
  file: string;
  label: string;
  bg: string;
  activeBg: string;
}

const SIMON_SOUNDS: SimonSound[] = [
  { file: "lahitos.mp3",     label: "להיטוס!",     bg: "bg-pink-400",   activeBg: "bg-pink-200"   },
  { file: "ichsikichsi.mp3", label: "איכסי קיסכי", bg: "bg-sky-400",    activeBg: "bg-sky-200"    },
  { file: "noobemet.mp3",    label: "נו באמת!",    bg: "bg-lime-400",   activeBg: "bg-lime-200"   },
  { file: "AtKishu.mp3",     label: "את קישוא",    bg: "bg-orange-400", activeBg: "bg-orange-200" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

type Phase = "idle" | "showing" | "player" | "gameover";
type GameoverPhase = "checking" | "name-input" | "submitting" | "done";

interface ScoreEntry {
  id: string;
  name: string;
  score: number;
}

interface Props {
  isQuietTime: boolean;
}

export default function SimonGame({ isQuietTime }: Props) {
  // Game state
  const [phase, setPhase] = useState<Phase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [lightsOnly, setLightsOnly] = useState(false);
  const gameIdRef = useRef(0);

  // Score / leaderboard state
  const [finalScore, setFinalScore] = useState(0);
  const [gameoverPhase, setGameoverPhase] = useState<GameoverPhase>("checking");
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [newEntryId, setNewEntryId] = useState<string | null>(null);

  const isSilent = lightsOnly || isQuietTime;

  // Load leaderboard on mount
  useEffect(() => {
    fetch("/api/simon/scores")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setLeaderboard(data))
      .catch(() => {});
  }, []);

  async function fetchAndCheckScore(score: number) {
    setGameoverPhase("checking");
    try {
      const data: ScoreEntry[] = await fetch("/api/simon/scores").then((r) => r.json());
      setLeaderboard(Array.isArray(data) ? data : []);
      const qualifies =
        score > 0 && (data.length < 10 || score > data[data.length - 1].score);
      setGameoverPhase(qualifies ? "name-input" : "done");
    } catch {
      setGameoverPhase("done");
    }
  }

  async function submitScore() {
    if (!nameInput.trim()) return;
    setGameoverPhase("submitting");
    try {
      const { id } = await fetch("/api/simon/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim(), score: finalScore }),
      }).then((r) => r.json());

      const updated: ScoreEntry[] = await fetch("/api/simon/scores").then((r) => r.json());
      setLeaderboard(Array.isArray(updated) ? updated : []);
      setNewEntryId(id ?? null);
    } catch {
      // fail silently, still transition
    }
    setGameoverPhase("done");
  }

  const runSequence = useCallback(
    async (seq: number[], round: number, gameId: number, silent: boolean) => {
      const highlightMs = Math.max(300, 800 - (round - 1) * 30);
      await sleep(500);
      for (const idx of seq) {
        if (gameIdRef.current !== gameId) return;
        setActiveIndex(idx);
        if (!silent) {
          new Audio(`/soundboard/${SIMON_SOUNDS[idx].file}`).play().catch(() => {});
        }
        await sleep(highlightMs);
        if (gameIdRef.current !== gameId) return;
        setActiveIndex(null);
        await sleep(150);
      }
      if (gameIdRef.current !== gameId) return;
      setPhase("player");
    },
    []
  );

  function startGame() {
    const id = ++gameIdRef.current;
    const firstIdx = Math.floor(Math.random() * 4);
    const newSeq = [firstIdx];
    setSequence(newSeq);
    setPlayerIndex(0);
    setRoundsCompleted(0);
    setWrongIndex(null);
    setActiveIndex(null);
    setNameInput("");
    setNewEntryId(null);
    setFinalScore(0);
    setPhase("showing");
    runSequence(newSeq, 1, id, isSilent);
  }

  function handlePlayerPress(idx: number) {
    if (phase !== "player") return;

    if (!isSilent) {
      new Audio(`/soundboard/${SIMON_SOUNDS[idx].file}`).play().catch(() => {});
    }
    setActiveIndex(idx);
    setTimeout(() => setActiveIndex((prev) => (prev === idx ? null : prev)), 250);

    if (idx !== sequence[playerIndex]) {
      setWrongIndex(idx);
      const score = roundsCompleted;
      setFinalScore(score);
      const id = ++gameIdRef.current;
      setTimeout(() => {
        if (gameIdRef.current !== id) return;
        setPhase("gameover");
        setActiveIndex(null);
        fetchAndCheckScore(score);
      }, 500);
      return;
    }

    const nextIdx = playerIndex + 1;
    if (nextIdx === sequence.length) {
      const newRoundsCompleted = roundsCompleted + 1;
      setRoundsCompleted(newRoundsCompleted);
      setPhase("showing");
      setPlayerIndex(0);
      const nextRandom = Math.floor(Math.random() * 4);
      const newSeq = [...sequence, nextRandom];
      setSequence(newSeq);
      const id = gameIdRef.current;
      setTimeout(() => {
        if (gameIdRef.current !== id) return;
        runSequence(newSeq, newSeq.length, id, isSilent);
      }, 600);
    } else {
      setPlayerIndex(nextIdx);
    }
  }

  const currentRound = sequence.length;

  return (
    <section className="w-full max-w-sm mx-auto px-4 pb-20 mt-1">

      {/* Quiet-time banner */}
      <AnimatePresence>
        {isQuietTime && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white/20 rounded-2xl px-4 py-2 mb-2 flex items-center gap-2 text-white"
          >
            <span className="text-xl shrink-0">🌙</span>
            <p className="text-sm font-bold leading-snug">
              מוֹד לַיְלָה פָּעִיל — מִשְׂחָק בְּאוֹרוֹת בִּלְבַד
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle row */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => !isQuietTime && setLightsOnly((v) => !v)}
          title={
            isQuietTime ? "לַיְלָה — רַק אוֹרוֹת" :
            lightsOnly  ? "הַפְעֵל צְלִילִים"       : "כַּבֵּה צְלִילִים"
          }
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold transition-colors ${
            isSilent
              ? "bg-white/25 text-white"
              : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
          } ${isQuietTime ? "opacity-60 cursor-default" : "cursor-pointer"}`}
        >
          {isSilent ? <VolumeX size={15} /> : <Volume2 size={15} />}
          {isSilent ? "רַק אוֹרוֹת" : "עִם צְלִילִים"}
        </button>
      </div>

      {/* Status line */}
      <AnimatePresence mode="wait">
        {(phase === "showing" || phase === "player") && (
          <motion.p
            key={phase + currentRound}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-white/80 font-bold text-base mb-3"
          >
            {phase === "showing"
              ? `סִבּוּב ${currentRound} — צְפוּ בְּעִיּוּן...`
              : `סִבּוּב ${currentRound} — תּוֹרְכֶם!`}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Start button — shown above grid when idle */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.div
            key="start-top"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex justify-center mb-4"
          >
            <button
              onClick={startGame}
              className="bg-white text-ink font-black text-xl py-4 px-10 rounded-3xl shadow-xl flex items-center gap-3"
            >
              <Play size={22} fill="currentColor" />
              הַתְחֵל
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2×2 Simon grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {SIMON_SOUNDS.map((sound, idx) => {
          const isActive = activeIndex === idx;
          const isWrong  = wrongIndex === idx;
          const isDimmed = (phase === "showing" || phase === "gameover") && !isActive && !isWrong;
          const bgClass  = isWrong ? "bg-red-500" : isActive ? sound.activeBg : sound.bg;

          return (
            <motion.button
              key={sound.file}
              onClick={() => handlePlayerPress(idx)}
              animate={
                isWrong
                  ? { x: [0, -10, 10, -8, 8, 0] }
                  : { scale: isActive ? 1.08 : isDimmed ? 0.92 : 1, opacity: isDimmed ? 0.3 : 1 }
              }
              transition={isWrong ? { duration: 0.4 } : { duration: 0.12 }}
              disabled={phase !== "player"}
              className={`${bgClass} rounded-3xl h-24 w-full flex items-center justify-center
                text-white text-xl font-bold text-center leading-tight drop-shadow
                ${isActive ? "shadow-2xl" : "shadow-md"}
                transition-colors duration-100
                ${phase === "player" ? "cursor-pointer" : "cursor-default"}`}
            >
              {sound.label}
            </motion.button>
          );
        })}
      </div>

      {/* Leaderboard (idle) + Game over */}
      <AnimatePresence mode="wait">

        {phase === "idle" && leaderboard.length > 0 && (
          <motion.div
            key="idle-lb"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-4"
          >
            <Leaderboard entries={leaderboard} highlightId={null} />
          </motion.div>
        )}

        {phase === "gameover" && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white/20 rounded-3xl p-4 text-white text-center"
          >
            <div className="text-3xl mb-1">
              {newEntryId ? "🎉" : "😵"}
            </div>
            <p className="font-black text-2xl mb-1">
              {newEntryId ? "כֹּל הַכָּבוֹד!" : "אוּיּ! טָעוּת!"}
            </p>
            <p className="text-base font-bold mb-3">
              הִשְׁלַמְתֶּם{" "}
              <span className="text-3xl font-black">{finalScore}</span>{" "}
              {finalScore === 1 ? "סִבּוּב" : "סִבּוּבִים"}
            </p>

            {gameoverPhase === "checking" && (
              <div className="flex justify-center py-2">
                <Loader2 size={24} className="animate-spin text-white/60" />
              </div>
            )}

            {gameoverPhase === "name-input" && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold text-yellow-200">🏆 נִכְנַסְתֶּם לְטוֹפ 10!</p>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitScore()}
                  placeholder="הַכְנִיסוּ שֵׁם..."
                  maxLength={20}
                  className="w-full bg-white/20 text-white placeholder-white/40 font-bold text-center
                    rounded-2xl px-4 py-3 text-base outline-none focus:bg-white/30 transition-colors"
                  autoFocus
                />
                <button
                  onClick={submitScore}
                  disabled={!nameInput.trim()}
                  className="bg-white text-ink font-black text-base py-3 px-6 rounded-2xl
                    disabled:opacity-40 transition-opacity"
                >
                  שְׁמוֹר תּוֹצָאָה
                </button>
                <button
                  onClick={() => setGameoverPhase("done")}
                  className="text-white/50 text-sm underline underline-offset-2"
                >
                  דַּלֵּג
                </button>
              </div>
            )}

            {gameoverPhase === "submitting" && (
              <div className="flex justify-center py-2">
                <Loader2 size={24} className="animate-spin text-white/60" />
              </div>
            )}

            {gameoverPhase === "done" && (
              <>
                {newEntryId && leaderboard.length > 0 && (
                  <Leaderboard entries={leaderboard} highlightId={newEntryId} />
                )}
                <button
                  onClick={startGame}
                  className="mt-2 bg-white text-ink font-black text-lg py-3 px-8 rounded-2xl inline-flex items-center gap-2"
                >
                  <RotateCcw size={18} />
                  שׁוּב!
                </button>
              </>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </section>
  );
}

function Leaderboard({ entries, highlightId }: { entries: ScoreEntry[]; highlightId: string | null }) {
  return (
    <div className="w-full">
      <p className="text-white/70 text-xs font-bold mb-1.5 text-center">טוֹפ 10</p>
      <div className="space-y-1">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-sm font-bold transition-colors ${
              entry.id === highlightId
                ? "bg-yellow-300/40 text-white"
                : "bg-white/10 text-white/80"
            }`}
          >
            <span className="text-base w-7 text-right shrink-0">
              {i < 3 ? MEDALS[i] : `${i + 1}.`}
            </span>
            <span className="flex-1 text-right px-2 truncate">{entry.name}</span>
            <span className="font-black text-white shrink-0">{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
