"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Share2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const TOTAL_QUESTIONS = 10;
const GAME_DURATION_SECS = 5 * 60;

type ClientQuestion = {
  question: string;
  options: [string, string, string, string];
};

type Participant = {
  id: string;
  name: string;
  score: number;
  finished_at: string | null;
};

type Room = {
  id: string;
  code: string;
  status: "lobby" | "active" | "finished";
  started_at: string | null;
  questions: ClientQuestion[];
};

export default function TriviaRoom({ code }: { code: string }) {
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [joinName, setJoinName] = useState("");
  const [joinStatus, setJoinStatus] = useState<"idle" | "loading" | "error">("idle");

  const [phase, setPhase] = useState<"join" | "lobby" | "playing" | "done">("join");
  const [currentQ, setCurrentQ] = useState(0);
  const [pickedAnswer, setPickedAnswer] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECS);

  const timerStartedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const startTimer = useCallback((startedAt: string) => {
    if (timerStartedRef.current) return;
    timerStartedRef.current = true;

    const tick = () => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
      const remaining = Math.max(0, GAME_DURATION_SECS - elapsed);
      setTimeLeft(Math.floor(remaining));
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        setPhase("done");
        fetch(`/api/trivia/${code}/finish`, { method: "POST" }).catch(() => {});
      }
    };
    tick();
    intervalRef.current = setInterval(tick, 500);
  }, [code]);

  // Load participantId from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`trivia_pid_${code}`);
    if (stored) setMyId(stored);
  }, [code]);

  // Fetch initial room state
  useEffect(() => {
    fetch(`/api/trivia/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setRoom(data);
        setParticipants(data.participants ?? []);
        if (data.started_at) startTimer(data.started_at);
      });
  }, [code, startTimer]);

  // Advance phase once we know both myId and room
  useEffect(() => {
    if (!myId || !room || phase !== "join") return;
    if (room.status === "finished") setPhase("done");
    else if (room.status === "active") setPhase("playing");
    else setPhase("lobby");
  }, [myId, room, phase]);

  // Realtime: room status + participants
  useEffect(() => {
    if (!room?.id) return;

    const refreshParticipants = () =>
      supabase
        .from("trivia_participants")
        .select("id, name, score, finished_at")
        .eq("room_id", room.id)
        .then(({ data }) => { if (data) setParticipants(data); });

    const channel = supabase
      .channel(`trivia-${room.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trivia_rooms", filter: `id=eq.${room.id}` },
        (payload) => {
          const updated = payload.new as { status: string; started_at: string | null };
          setRoom((prev) =>
            prev ? { ...prev, status: updated.status as Room["status"], started_at: updated.started_at } : prev
          );
          if (updated.started_at) startTimer(updated.started_at);
          if (updated.status === "active") setPhase((p) => (p === "lobby" ? "playing" : p));
          if (updated.status === "finished") {
            clearInterval(intervalRef.current ?? undefined);
            setPhase("done");
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trivia_participants", filter: `room_id=eq.${room.id}` },
        refreshParticipants
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room?.id, startTimer]);

  async function handleJoin() {
    if (!joinName.trim()) return;
    setJoinStatus("loading");
    try {
      const res = await fetch(`/api/trivia/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: joinName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setJoinStatus("error"); return; }
      localStorage.setItem(`trivia_pid_${code}`, data.participantId);
      setMyId(data.participantId);
      setJoinStatus("idle");
      trackEvent("trivia_joined", { code });
    } catch {
      setJoinStatus("error");
    }
  }

  async function handleAnswer(selectedIndex: number) {
    if (pickedAnswer !== null || !myId) return;
    setPickedAnswer(selectedIndex);

    const res = await fetch(`/api/trivia/${code}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: myId, questionIndex: currentQ, selectedIndex }),
    });
    const data = await res.json();
    const correct = data.isCorrect as boolean;
    setLastResult(correct);
    if (correct) setMyScore((s) => s + 1);
    trackEvent("trivia_answer", { code, question_index: currentQ, correct });

    setTimeout(() => {
      setPickedAnswer(null);
      setLastResult(null);
      if (currentQ + 1 >= TOTAL_QUESTIONS) {
        trackEvent("trivia_completed", { code, score: myScore + (correct ? 1 : 0) });
        setPhase("done");
      } else {
        setCurrentQ((q) => q + 1);
      }
    }, 1400);
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://hesketosfanapp.vercel.app/trivia/${code}`;

  // Loading
  if (!room) {
    return (
      <div className="min-h-screen bg-yellow flex items-center justify-center">
        <p className="text-white text-2xl font-black animate-pulse">טוֹעֵן...</p>
      </div>
    );
  }

  // ── JOIN ──────────────────────────────────────────────────────────────────
  if (phase === "join") {
    return (
      <div className="min-h-screen bg-yellow relative flex flex-col items-center justify-center gap-6 px-6 pb-24">
        <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />
        <div className="text-center">
          <div className="text-7xl mb-3">👑</div>
          <h1 className="text-5xl font-black text-white">מֶלֶךְ הַטְּרִיוִויָה</h1>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <input
            className="w-full px-4 py-4 rounded-2xl text-xl text-right text-ink font-bold outline-none"
            placeholder="הַשֵּׁם שֶׁלְּךָ..."
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            autoFocus
          />
          {joinStatus === "error" && (
            <p className="text-red-200 text-center font-bold">שְׁגִיאָה, נַסֵּה שׁוּב</p>
          )}
          <button
            onClick={handleJoin}
            disabled={!joinName.trim() || joinStatus === "loading"}
            className="bg-ink text-white font-black text-2xl py-4 rounded-2xl disabled:opacity-40 active:scale-95 transition-transform"
          >
            {joinStatus === "loading" ? "מִצְטָרֵף..." : "הִצְטָרֵף! ▶"}
          </button>
        </div>
      </div>
    );
  }

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    return (
      <div className="min-h-screen bg-yellow relative flex flex-col items-center gap-6 px-6 pt-10 pb-24">
        <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />
        <h1 className="text-5xl font-black text-white text-center">מֶלֶךְ<br />הַטְּרִיוִויָה 👑</h1>

        <button
          onClick={() => {
            if (navigator.share) navigator.share({ url: shareUrl, title: "הצטרפו לתחרות!" });
            else navigator.clipboard?.writeText(shareUrl);
          }}
          className="flex items-center gap-2 bg-white text-ink font-bold text-lg px-6 py-3 rounded-2xl active:scale-95 transition-transform"
        >
          <Share2 size={20} />
          הַזְמִינוּ חֲבֵרִים
        </button>

        <div className="w-full max-w-xs">
          <p className="text-white font-bold text-xl mb-3 text-center">
            מִשְׂתַּתְּפִים ({participants.length}):
          </p>
          <div className="flex flex-col gap-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="bg-white/20 rounded-xl px-4 py-3 text-white font-bold text-lg text-center"
              >
                {p.id === myId ? `${p.name} (אַתָּה)` : p.name}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setPhase("playing")}
          className="bg-ink text-white font-black text-2xl px-10 py-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
        >
          אֲנִי מוּכָן! ▶
        </button>
        <div className="text-center px-4 flex flex-col gap-1">
          <p className="text-white font-bold text-base">⏱️ יֵשׁ לָכֶם 5 דַּקּוֹת לַעֲנוֹת עַל 10 שְׁאֵלוֹת</p>
          <p className="text-white/60 text-sm">הַשָּׁעוֹן יַתְחִיל כְּשֶׁמִּישֶׁהוּ יַעֲנֶה עַל הַשְּׁאֵלָה הָרִאשׁוֹנָה</p>
        </div>
      </div>
    );
  }

  // ── PLAYING ───────────────────────────────────────────────────────────────
  if (phase === "playing") {
    const q = room.questions[currentQ];
    if (!q) return null;

    return (
      <div className="min-h-screen bg-blue relative flex flex-col items-center gap-4 px-4 pt-6 pb-24">
        <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />

        {/* Header */}
        <div className="flex items-center justify-between w-full max-w-sm">
          <span className="text-white font-bold text-lg">
            {currentQ + 1} / {TOTAL_QUESTIONS}
          </span>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              timeLeft < 60 ? "bg-red-400/60" : "bg-white/20"
            }`}
          >
            <Clock size={18} className="text-white" />
            <span className="text-white font-black text-xl">{formatTime(timeLeft)}</span>
          </div>
          <span className="text-white font-bold text-lg">⭐ {myScore}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${(currentQ / TOTAL_QUESTIONS) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-md">
          <p className="text-ink font-black text-2xl text-right leading-snug">{q.question}</p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {q.options.map((opt, i) => {
            const picked = pickedAnswer !== null;
            const isThis = pickedAnswer === i;
            let bg = "bg-white/20";
            if (picked && isThis && lastResult !== null)
              bg = lastResult ? "bg-green-400" : "bg-red-400";
            else if (picked && isThis)
              bg = "bg-white/40";

            const answerNums = ["1", "2", "3", "4"];

            return (
              <motion.button
                key={i}
                whileTap={!picked ? { scale: 0.97 } : {}}
                onClick={() => handleAnswer(i)}
                disabled={picked}
                className={`${bg} rounded-2xl px-4 py-4 text-white font-bold text-xl text-right flex items-center gap-3 transition-colors`}
              >
                <span className="bg-white/30 rounded-xl w-9 h-9 flex items-center justify-center text-white font-black text-lg shrink-0">
                  {answerNums[i]}
                </span>
                <span className="flex-1">{opt}</span>
                {picked && isThis && lastResult !== null && (
                  lastResult
                    ? <CheckCircle2 size={24} className="text-white shrink-0" />
                    : <XCircle size={24} className="text-white shrink-0" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── LEADERBOARD ───────────────────────────────────────────────────────────
  const sorted = [...participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.finished_at && b.finished_at)
      return new Date(a.finished_at).getTime() - new Date(b.finished_at).getTime();
    if (a.finished_at) return -1;
    if (b.finished_at) return 1;
    return 0;
  });

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-lavender relative flex flex-col items-center gap-5 px-6 pt-10 pb-24">
      <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />
      <h1 className="text-5xl font-black text-white text-center">🏆 תוצאות</h1>

      {sorted[0] && (
        <p className="text-white text-2xl font-black text-center">
          👑 {sorted[0].name} מֶלֶךְ/מַלְכַּת הַטְּרִיוִויָה!
        </p>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
        {sorted.map((p, i) => {
          const isMe = p.id === myId;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl ${isMe ? "bg-white" : "bg-white/20"}`}
            >
              <span className="text-2xl w-8 text-center">{medals[i] ?? `${i + 1}.`}</span>
              <span className={`font-black text-xl flex-1 text-right ${isMe ? "text-ink" : "text-white"}`}>
                {p.name}{isMe ? " (אַתָּה)" : ""}
              </span>
              <span className={`font-black text-xl ${isMe ? "text-ink" : "text-white"}`}>
                {p.score} ⭐
              </span>
            </motion.div>
          );
        })}
      </div>

      <button
        onClick={() => router.push("/trivia")}
        className="bg-ink text-white font-black text-xl px-8 py-4 rounded-2xl mt-4 active:scale-95 transition-transform"
      >
        תַּחֲרוּת חֲדָשָׁה 🔄
      </button>
    </div>
  );
}
