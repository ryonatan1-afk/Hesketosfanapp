"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Share2, Play, Pause, Mic, Square, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { trackEvent } from "@/lib/analytics";
import { jokes } from "@/data/baktus-jokes";
import { useAudioPlayer } from "./useAudioPlayer";
import { useRecorder } from "./useRecorder";

interface WallEmoji {
  emoji: string;
  x: number;
  y: number;
  size: number;
  ts: number;
  isNew?: boolean;
}

// ── Static page data ──────────────────────────────────────────────────────────


const SEED_WALL: WallEmoji[] = [
  { emoji: "❤️", x: 8,  y: 15, size: 22, ts: 1 },
  { emoji: "🪳", x: 18, y: 58, size: 18, ts: 2 },
  { emoji: "😂", x: 30, y: 22, size: 24, ts: 3 },
  { emoji: "🔥", x: 42, y: 65, size: 20, ts: 4 },
  { emoji: "💕", x: 52, y: 8,  size: 18, ts: 5 },
  { emoji: "⭐", x: 62, y: 48, size: 22, ts: 6 },
  { emoji: "🪳", x: 73, y: 28, size: 16, ts: 7 },
  { emoji: "❤️", x: 81, y: 70, size: 20, ts: 8 },
  { emoji: "😂", x: 89, y: 18, size: 18, ts: 9 },
  { emoji: "💯", x: 23, y: 78, size: 16, ts: 10 },
  { emoji: "🤣", x: 66, y: 80, size: 22, ts: 11 },
  { emoji: "⭐", x: 5,  y: 78, size: 14, ts: 12 },
  { emoji: "🔥", x: 93, y: 52, size: 16, ts: 13 },
];


// ── Component ─────────────────────────────────────────────────────────────────

export default function BaktusPage() {
  const player         = useAudioPlayer();
  const playAllIdxRef  = useRef(0);

  const [wallEmojis, setWallEmojis] = useState<WallEmoji[]>([]);
  const [emojiCount, setEmojiCount] = useState(5847);
  const wallRef = useRef<HTMLDivElement>(null);

  const [subscribed,    setSubscribed]    = useState(false);
  const [followers,     setFollowers]     = useState(4);
  const [followerBump,  setFollowerBump]  = useState(false);
  const [rejectMsg,     setRejectMsg]     = useState(false);
  const subscribeRef = useRef<HTMLButtonElement>(null);

  // Stage 5 & 6: Voice recording
  const recorder = useRecorder();
  const [recorderName,         setRecorderName]         = useState("");
  const [consent,              setConsent]              = useState(false);
  const [submitting,           setSubmitting]           = useState(false);
  const [submitted,            setSubmitted]            = useState(false);
  const [submitError,          setSubmitError]          = useState<string | null>(null);
  const [hasPendingSubmission, setHasPendingSubmission] = useState(false);
  const [previewPlaying,       setPreviewPlaying]       = useState(false);
  const [previewProgress,      setPreviewProgress]      = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  interface FanRecording { id: string; name: string; audio_url: string | null; created_at: string; }
  const [fanRecordings,        setFanRecordings]        = useState<FanRecording[]>([]);
  const [fanRecordingsLoading, setFanRecordingsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("baktus_emoji_wall");
      setWallEmojis(stored ? (JSON.parse(stored) as WallEmoji[]) : SEED_WALL);
      const cnt = localStorage.getItem("baktus_emoji_count");
      if (cnt) setEmojiCount(parseInt(cnt, 10));
      if (localStorage.getItem("baktus_subscribed") === "1") {
        setSubscribed(true);
        setFollowers(5);
      }
      if (localStorage.getItem("baktus_pending_recording")) {
        setHasPendingSubmission(true);
      }
    } catch {
      setWallEmojis(SEED_WALL);
    }
  }, []);

  useEffect(() => {
    fetch("/api/baktus/recordings")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFanRecordings(data); })
      .catch(() => {})
      .finally(() => setFanRecordingsLoading(false));
  }, []);

  // Preview audio: wire up when a recording finishes
  useEffect(() => {
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    setPreviewPlaying(false);
    setPreviewProgress(0);

    if (!recorder.audioUrl) return;
    const audio = new Audio(recorder.audioUrl);
    previewAudioRef.current = audio;
    audio.ontimeupdate = () => {
      if (audio.duration) setPreviewProgress(audio.currentTime / audio.duration);
    };
    audio.onended = () => { setPreviewPlaying(false); setPreviewProgress(0); };
    return () => { audio.pause(); audio.src = ""; };
  }, [recorder.audioUrl]);

  function togglePreview() {
    const audio = previewAudioRef.current;
    if (!audio) return;
    if (previewPlaying) { audio.pause(); setPreviewPlaying(false); }
    else { audio.play().catch(() => {}); setPreviewPlaying(true); }
  }

  async function handleSubmitRecording() {
    if (!recorder.blob || !recorderName.trim() || !consent || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    trackEvent("baktus_recording_submit", { name: recorderName.trim() });

    try {
      const form = new FormData();
      form.append("audio", recorder.blob, `recording.${recorder.blob.type.includes("mp4") ? "m4a" : "webm"}`);
      form.append("name", recorderName.trim());

      const res = await fetch("/api/baktus/submit-recording", { method: "POST", body: form });

      if (res.ok) {
        localStorage.removeItem("baktus_pending_recording");
        setHasPendingSubmission(false);
        previewAudioRef.current?.pause();
        previewAudioRef.current = null;
        recorder.reset();
        setRecorderName("");
        setConsent(false);
        setSubmitted(true);
      } else if (res.status === 429) {
        setSubmitError("שָׁלַחְתֶּם יוֹתֵר מִדַּי הֶקְלָטוֹת. נַסּוּ שׁוּב בְּעוֹד שָׁעָה ⏰");
        trackEvent("baktus_recording_rate_limited");
      } else {
        setSubmitError("מַשֶּׁהוּ לֹא הָלַךְ. בִּדְקוּ חִיבּוּר אִינְטֶרְנֶט וְנַסּוּ שׁוּב 😔");
      }
    } catch {
      setSubmitError("מַשֶּׁהוּ לֹא הָלַךְ. בִּדְקוּ חִיבּוּר אִינְטֶרְנֶט וְנַסּוּ שׁוּב 😔");
    } finally {
      setSubmitting(false);
    }
  }

  function addEmoji(emoji: string) {
    const item: WallEmoji = {
      emoji,
      x:    5  + Math.random() * 88,
      y:    8  + Math.random() * 72,
      size: Math.round(16 + Math.random() * 12),
      ts:   Date.now(),
      isNew: true,
    };
    setWallEmojis(prev => {
      const next = [...prev, item].slice(-150);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      localStorage.setItem("baktus_emoji_wall", JSON.stringify(next.map(({ isNew: _, ...r }) => r)));
      return next;
    });
    setEmojiCount(prev => {
      const next = prev + 1;
      localStorage.setItem("baktus_emoji_count", String(next));
      return next;
    });
    trackEvent("baktus_emoji_tap", { emoji });
  }

  function handleSubscribe() {
    if (subscribed) {
      // Rejection gag
      setRejectMsg(true);
      setTimeout(() => setRejectMsg(false), 2200);
      trackEvent("baktus_unsubscribe_attempt");
      return;
    }
    setSubscribed(true);
    setFollowers(5);
    setFollowerBump(true);
    setTimeout(() => setFollowerBump(false), 600);
    localStorage.setItem("baktus_subscribed", "1");
    trackEvent("baktus_subscribe_click");

    // Confetti burst from the button
    const btn = subscribeRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top  + rect.height / 2) / window.innerHeight,
        },
        colors: ["#ef4444", "#f59e0b", "#68B8ED", "#9090CC", "#F08060"],
        scalar: 0.9,
      });
    }
  }

  function handleShare() {
    const url  = "https://hesketosfanapp.vercel.app/baktus";
    const text = "תראו את בקטוס — כוכב עולה 🪳";
    trackEvent("baktus_share_click");
    if (navigator.share) {
      navigator.share({ title: "בקטוס", text, url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank", "noopener,noreferrer");
    }
  }

  const newest     = jokes[0];
  const olderJokes = jokes.slice(1);

  function handlePlayAll() {
    playAllIdxRef.current = 0;
    const playNext = () => {
      const idx  = playAllIdxRef.current;
      if (idx >= jokes.length) return;
      playAllIdxRef.current++;
      const joke = jokes[idx];
      trackEvent("baktus_joke_play", { joke_id: joke.id, source: "play_all" });
      player.play(String(joke.id), joke.audioUrl, playNext);
    };
    playNext();
  }

  return (
    <div className="min-h-screen bg-[#fef6e4] pb-24">

      {/* ── 1. Profile Header ──────────────────────────────────────────────── */}
      <section className="bg-white mx-4 mt-4 rounded-3xl p-5 shadow-sm text-center">

        {/* Avatar with badges */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-[88px] h-[88px] rounded-full border-4 border-amber-200 overflow-hidden bg-amber-50">
            <Image src="/baktus.png" alt="בַּקְטוּס" width={88} height={88} className="object-cover w-full h-full" priority />
          </div>
          {/* LIVE badge — top-right of avatar */}
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-[3px] rounded-full flex items-center gap-1 leading-none">
            <span className="w-[5px] h-[5px] bg-white rounded-full animate-pulse inline-block" />
            LIVE
          </span>
          {/* Verified badge — bottom-left of avatar */}
          <span
            title="מְאוּמָת עַל יָדִי"
            className="absolute -bottom-1 -left-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-black text-[11px] cursor-help shadow-sm"
          >
            ✓
          </span>
        </div>

        {/* Name */}
        <h1 className="text-2xl font-black mt-3 text-[#1a1a2e]">בַּקְטוּס</h1>

        {/* Handle — intentionally LTR */}
        <p className="text-xs text-gray-400 font-mono mt-1" dir="ltr" aria-label="שֵׁם מִשְׁתַּמֵּשׁ: baktus_official_real_no_fake">
          @baktus_official_real_no_fake
        </p>

        {/* Bio */}
        <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-xs mx-auto">
          כּוֹכָב עוֹלֶה 🌟 הַמְּנַהֵל שֶׁלִּי: אַבָּא שֶׁלִּי · גָּר מִתַּחַת לַמְּקָרֵר · הָאַהֲבָה שֶׁלִּי 💕 עָדָה
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-4">
          <div className="text-center">
            <motion.p
              key={followers}
              animate={followerBump ? { scale: [1, 1.5, 1], color: ["#1a1a2e", "#ef4444", "#1a1a2e"] } : {}}
              transition={{ duration: 0.5 }}
              className="text-2xl font-black text-[#1a1a2e]"
            >
              {followers}
            </motion.p>
            <p className="text-[11px] text-gray-500 mt-0.5">עוֹקְבִים</p>
          </div>
          {[
            { n: "12", label: "לַיְקִים"  },
            { n: "8",  label: "בְּדִיחוֹת" },
          ].map(({ n, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-black text-[#1a1a2e]">{n}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center items-center gap-3 mt-5 relative">
          <motion.button
            ref={subscribeRef}
            onClick={handleSubscribe}
            whileTap={{ scale: 0.93 }}
            className={`flex items-center gap-2 font-black text-base px-6 py-3 rounded-2xl shadow-md transition-colors ${
              subscribed
                ? "bg-gray-200 text-gray-500"
                : "bg-red-500 text-white"
            }`}
          >
            {subscribed ? <BellOff size={18} /> : <Bell size={18} />}
            {subscribed ? "נִרְשַׁמְתֶּם ✓" : "הִירָשְׁמוּ עַכְשָׁיו!!!"}
          </motion.button>
          <button
            onClick={handleShare}
            aria-label="שַׁתֵּף אֶת הָעַמּוּד בְּוָואטְסָאפּ"
            className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-2xl hover:bg-gray-200 active:scale-95 transition-all"
          >
            <Share2 size={18} className="text-gray-600" />
          </button>

          {/* Rejection toast */}
          <AnimatePresence>
            {rejectMsg && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0,  scale: 1   }}
                exit={{    opacity: 0, y: -8, scale: 0.9 }}
                className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[#1a1a2e] text-white text-xs font-bold px-4 py-2 rounded-2xl whitespace-nowrap shadow-lg"
              >
                אִי אֶפְשָׁר לַעֲזוֹב אוֹתִי 😤
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </section>

      {/* ── 2. Friday Jokes Feed ───────────────────────────────────────────── */}
      <section className="bg-white mx-4 mt-4 rounded-3xl p-5 shadow-sm">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mic size={18} className="text-[#68B8ED]" />
            <h2 className="font-black text-lg text-[#1a1a2e]">בְּדִיחוֹת יוֹם שִׁישִׁי</h2>
          </div>
          <button
            onClick={() => { trackEvent("baktus_play_all_click"); handlePlayAll(); }}
            className="flex items-center gap-1 text-xs font-bold text-[#68B8ED] bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
          >
            <Play size={11} fill="#68B8ED" className="text-[#68B8ED]" />
            נַגֵּן הַכֹּל
          </button>
        </div>

        {/* Newest / featured joke */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 relative mb-4 overflow-hidden">
          <span className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-black px-2 py-[3px] rounded-full">
            🔥 חָדָשׁ
          </span>
          <div className="flex items-center gap-4 mt-5">
            <button
              onClick={() => {
                trackEvent("baktus_joke_play", { joke_id: newest.id, joke_number: newest.number });
                player.play(String(newest.id), newest.audioUrl);
              }}
              aria-label={player.playingId === String(newest.id) ? "הַשְׁהֵה" : `נַגֵּן בְּדִיחָה: ${newest.title}`}
              className="w-14 h-14 bg-[#1a1a2e] rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            >
              {player.playingId === String(newest.id)
                ? <Pause size={22} fill="white" className="text-white" />
                : <Play  size={22} fill="white" className="text-white translate-x-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-black text-base text-[#1a1a2e] leading-snug">{newest.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {newest.date} · פֶּרֶק {newest.episode} · {newest.duration}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-3 border-t border-amber-100 pt-2">
            {newest.views} צְפִיּוֹת · {newest.likes} לַיְק · {newest.comments} תְּגוּבוֹת
          </p>
          {/* Progress bar */}
          {player.playingId === String(newest.id) && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-200">
              <div
                className="h-full bg-amber-500 transition-[width] duration-200"
                style={{ width: `${player.progress * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Older jokes */}
        <div className="divide-y divide-gray-100">
          {olderJokes.map((j) => {
            const isActive = player.playingId === String(j.id);
            return (
              <div key={j.id} className={`flex items-center gap-3 py-3 transition-colors ${isActive ? "bg-blue-50 -mx-5 px-5 rounded-xl" : ""}`}>
                <button
                  onClick={() => {
                    trackEvent("baktus_joke_play", { joke_id: j.id, joke_number: j.number });
                    player.play(String(j.id), j.audioUrl);
                  }}
                  aria-label={isActive ? "הַשְׁהֵה" : `נַגֵּן בְּדִיחָה: ${j.title}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all ${isActive ? "bg-[#68B8ED]" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  {isActive
                    ? <Pause size={13} fill="white" className="text-white" />
                    : <Play  size={13} fill="#6b7280" className="text-gray-500 translate-x-0.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#1a1a2e] truncate">{j.title}</p>
                  {isActive ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-blue-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#68B8ED] transition-[width] duration-200"
                          style={{ width: `${player.progress * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 flex-shrink-0">
                        {Math.floor(player.elapsed / 60)}:{String(Math.floor(player.elapsed % 60)).padStart(2, "0")}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      פֶּרֶק {j.episode} · {j.duration} · {j.views} צְפִיּוֹת
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-300 font-bold flex-shrink-0">#{j.number}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. Send Recording ──────────────────────────────────────────────── */}
      <section className="mx-4 mt-4 rounded-3xl bg-pink-50 p-5 shadow-sm relative overflow-hidden">
        {/* DM tag — corner ribbon */}
        <span className="absolute top-0 right-0 bg-pink-200 text-pink-700 text-[10px] font-black px-3 py-1.5 rounded-tr-3xl rounded-bl-2xl">
          DM שֶׁל בַּקְטוּס
        </span>

        <div className="pt-6">
          <h2 className="font-black text-lg text-[#1a1a2e]">שִׁלְחוּ לִי הוֹדָעָה! 📩</h2>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            תַּקְלִיטוּ לִי בְּדִיחָה, שִׁיר, אוֹ בְּרָכָה — וְאוּלַי אֲעֲלֶה אֶת זֶה לַפְּרוֹפִיל שֶׁלִּי! 🤩
          </p>

          {/* Pending submission note */}
          <AnimatePresence>
            {hasPendingSubmission && !submitted && recorder.status === "idle" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="bg-pink-100 border border-pink-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-pink-700 font-bold">📬 יֵשׁ לָנוּ הֶקְלָטָה שֶׁלְּךָ שֶׁמַּמְתִּינָה...</p>
                  <button
                    onClick={() => {
                      localStorage.removeItem("baktus_pending_recording");
                      setHasPendingSubmission(false);
                      trackEvent("baktus_pending_dismiss");
                    }}
                    aria-label="סְגוֹר"
                    className="text-xs text-pink-400 hover:text-pink-600 font-bold flex-shrink-0"
                  >✕</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submitted success state */}
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-4 bg-white rounded-2xl p-6 text-center shadow-inner"
              >
                <p className="text-5xl mb-3">🤩</p>
                <p className="font-black text-xl text-[#1a1a2e]">קִיבַּלְנוּ!</p>
                <p className="text-sm text-gray-500 mt-1">בַּקְטוּס יֶרְאֶה אֶת זֶה בְּקָרוֹב</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-sm text-pink-500 font-bold hover:underline"
                >
                  שִׁלְחוּ עוֹד הֶקְלָטָה
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={false}
                className="bg-pink-100 rounded-2xl p-4 mt-4 flex flex-col items-center gap-4"
              >
                {/* Name input */}
                <div className="w-full">
                  <label className="block text-sm font-bold text-[#1a1a2e] mb-1.5">
                    אֵיךְ קוֹרְאִים לְךָ?
                  </label>
                  <input
                    type="text"
                    value={recorderName}
                    onChange={(e) => setRecorderName(e.target.value)}
                    placeholder="הַשֵּׁם שֶׁלִּי הוּא..."
                    maxLength={40}
                    disabled={recorder.status === "recording"}
                    className="w-full bg-white rounded-xl px-4 py-3 text-sm text-[#1a1a2e] placeholder:text-gray-500 border border-pink-200 outline-none focus:ring-2 focus:ring-pink-300 transition-shadow disabled:opacity-60"
                  />
                  <p className="text-xs text-gray-500 mt-1">רַק שֵׁם פְּרָטִי 😊</p>
                </div>

                {/* Screen-reader announcements for recording state changes */}
                <p className="sr-only" aria-live="polite" aria-atomic="true">
                  {recorder.status === "recorded"
                    ? "הַהֶקְלָטָה הֶסְתַּיְּמָה. מַלְּאוּ שֵׁם וְהַגִּישׁוּ"
                    : recorder.status === "error"
                    ? (recorder.errorMsg ?? "")
                    : ""}
                </p>

                {/* Error state */}
                {recorder.status === "error" && (
                  <div className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                    <p className="text-sm text-red-600 font-bold">{recorder.errorMsg}</p>
                    <button
                      onClick={recorder.reset}
                      className="mt-3 text-xs font-bold text-red-500 bg-red-100 px-4 py-2 rounded-xl hover:bg-red-200 transition-colors"
                    >
                      נַסּוּ שׁוּב
                    </button>
                  </div>
                )}

                {/* Idle — big mic button */}
                {recorder.status === "idle" && (
                  <div className="flex flex-col items-center gap-2">
                    <motion.button
                      onClick={() => { trackEvent("baktus_record_start"); recorder.start(); }}
                      whileTap={{ scale: 0.92 }}
                      aria-label="הַקְלֵט הוֹדָעָה קוֹלִית"
                      className="w-[72px] h-[72px] rounded-full bg-red-500 flex items-center justify-center shadow-lg"
                    >
                      <Mic size={30} className="text-white" />
                    </motion.button>
                    <p className="text-xs text-gray-500 text-center">
                      לִחֲצוּ כְּדֵי לְהַקְלִיט · עַד 30 שְׁנִיּוֹת
                    </p>
                  </div>
                )}

                {/* Recording — countdown + stop */}
                {recorder.status === "recording" && (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                      <span className={`font-black text-2xl tabular-nums ${recorder.countdown <= 5 ? "text-red-600" : "text-[#1a1a2e]"}`}>
                        {recorder.countdown}
                      </span>
                      <span className="text-xs text-gray-500">שְׁנִיּוֹת</span>
                    </div>
                    <div className="w-full h-2 bg-pink-200 rounded-full overflow-hidden" dir="ltr">
                      <div
                        className="h-full bg-red-400 transition-[width] duration-1000"
                        style={{ width: `${((30 - recorder.countdown) / 30) * 100}%` }}
                      />
                    </div>
                    <motion.button
                      onClick={() => { trackEvent("baktus_record_stop"); recorder.stop(); }}
                      whileTap={{ scale: 0.92 }}
                      aria-label="עֲצוֹר הַקְלָטָה"
                      className="w-14 h-14 rounded-full bg-[#1a1a2e] flex items-center justify-center shadow-md"
                    >
                      <Square size={18} fill="white" className="text-white" />
                    </motion.button>
                    <p className="text-xs text-gray-500">לִחֲצוּ לַעֲצוֹר</p>
                  </div>
                )}

                {/* Recorded — preview player + re-record */}
                {recorder.status === "recorded" && (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="flex items-center gap-3 w-full bg-white rounded-2xl px-4 py-3 shadow-sm">
                      <button
                        onClick={togglePreview}
                        aria-label={previewPlaying ? "הַשְׁהֵה תַּצּוּגָה מֵקְדִּימָה" : "נַגֵּן תַּצּוּגָה מֵקְדִּימָה"}
                        className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                      >
                        {previewPlaying
                          ? <Pause size={15} fill="white" className="text-white" />
                          : <Play  size={15} fill="white" className="text-white translate-x-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1a1a2e]">הַהֶקְלָטָה שֶׁלְּךָ</p>
                        <div className="w-full h-1.5 bg-pink-100 rounded-full mt-1.5 overflow-hidden" dir="ltr">
                          <div
                            className="h-full bg-pink-400 transition-[width] duration-200"
                            style={{ width: `${previewProgress * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        previewAudioRef.current?.pause();
                        trackEvent("baktus_record_reset");
                        recorder.reset();
                        setConsent(false);
                        setSubmitError(null);
                      }}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-600 transition-colors"
                    >
                      <RotateCcw size={12} />
                      הַקְלִיטוּ שׁוּב
                    </button>
                  </div>
                )}

                {/* Consent checkbox */}
                {recorder.status === "recorded" && (
                  <label className="flex items-start gap-3 w-full cursor-pointer select-none">
                    <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          consent ? "bg-red-500 border-red-500" : "bg-white border-pink-300"
                        }`}
                      >
                        {consent && <span className="text-white text-[11px] font-black leading-none">✓</span>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 leading-relaxed">
                      אֲנִי מַסְכִּים/מַסְכִּימָה שֶׁהַהֶקְלָטָה שֶׁלִּי תִּשָּׁמַע עַל יְדֵי בַּקְטוּס 🎙️
                    </span>
                  </label>
                )}

                {/* Submit error */}
                <AnimatePresence>
                  {submitError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="w-full text-xs text-red-600 font-bold text-center bg-red-50 rounded-xl px-3 py-2"
                    >
                      {submitError}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Submit */}
                {(() => {
                  const canSubmit = recorder.status === "recorded" && recorderName.trim() && consent && !submitting;
                  return (
                    <motion.button
                      onClick={handleSubmitRecording}
                      disabled={!canSubmit}
                      whileTap={canSubmit ? { scale: 0.96 } : {}}
                      className={`w-full font-black text-base py-3 rounded-2xl transition-all ${
                        canSubmit
                          ? "bg-red-500 text-white shadow-md"
                          : "bg-red-400 text-white opacity-40 cursor-not-allowed"
                      }`}
                    >
                      {submitting ? "שׁוֹלֵחַ..." : "שִׁלְחוּ לְבַקְטוּס"}
                    </motion.button>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-xs text-gray-500 mt-3 text-center">
            💡 בַּקְטוּס בּוֹחֵר אִישִׁית כָּל הֶקְלָטָה שֶׁעוֹלָה לַפְּרוֹפִיל
          </p>
        </div>
      </section>

      {/* ── 4. Fan Recordings ──────────────────────────────────────────────── */}
      <section className="bg-white mx-4 mt-4 rounded-3xl p-5 shadow-sm">
        <h2 className="font-black text-lg text-[#1a1a2e]">מַה שֶּׁשָּׁלְחוּ לִי 📬</h2>
        <p className="text-sm text-gray-500 mt-1 mb-4">הֶקְלָטוֹת מֵהַמַּעֲרִיצִים שֶׁשָּׁמַעְתִּי</p>

        {fanRecordingsLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : fanRecordings.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">🎙️</p>
            <p className="text-sm text-gray-500">עֲדַיִן אֵין הֶקְלָטוֹת. שִׁלְחוּ לִי מַשֶּׁהוּ!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {fanRecordings.map((rec) => {
              const isActive = player.playingId === rec.id;
              return (
                <div key={rec.id} className={`flex items-center gap-3 rounded-2xl p-3 transition-colors ${isActive ? "bg-blue-50" : "bg-gray-50"}`}>
                  <button
                    onClick={() => {
                      if (rec.audio_url) {
                        trackEvent("baktus_fan_recording_play", { id: rec.id });
                        player.play(rec.id, rec.audio_url);
                      }
                    }}
                    disabled={!rec.audio_url}
                    aria-label={isActive ? "הַשְׁהֵה" : `נַגֵּן הֶקְלָטָה שֶׁל ${rec.name}`}
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all disabled:opacity-40 ${isActive ? "bg-[#68B8ED]" : "bg-[#1a1a2e] hover:bg-gray-800"}`}
                  >
                    {isActive
                      ? <Pause size={13} fill="white" className="text-white" />
                      : <Play  size={13} fill="white" className="text-white translate-x-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#1a1a2e] truncate">{rec.name}</p>
                    {isActive && (
                      <div className="w-full h-1 bg-blue-200 rounded-full mt-1.5 overflow-hidden" dir="ltr">
                        <div className="h-full bg-[#68B8ED] transition-[width] duration-200" style={{ width: `${player.progress * 100}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 5. Emoji Wall ──────────────────────────────────────────────────── */}
      <section className="bg-white mx-4 mt-4 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-black text-lg text-[#1a1a2e]">קִיר הָאִימוֹגִ׳ים</h2>
          <span className="text-sm font-bold text-purple-500">
            {emojiCount.toLocaleString("he-IL")} מֵהַמַּעֲרִיצִים
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          תִּלְחֲצוּ עַל אִימוֹגִ׳י וְהוּא יַעוּף לַקִּיר ✨
        </p>

        {/* Wall */}
        <div
          ref={wallRef}
          className="relative bg-purple-50 rounded-2xl h-32 overflow-hidden mb-3"
        >
          {wallEmojis.map((e, i) => {
            const floats = i % 13 === 2 || i % 13 === 6 || i % 13 === 10;
            return (
              <motion.span
                key={e.ts}
                aria-hidden="true"
                drag
                dragConstraints={wallRef}
                dragMomentum
                dragElastic={0}
                dragTransition={{ bounceStiffness: 600, bounceDamping: 4 }}
                whileDrag={{ scale: 1.4, zIndex: 50, cursor: "grabbing" }}
                initial={e.isNew ? { opacity: 0, scale: 0.2 } : false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                style={{
                  position: "absolute",
                  left: `${e.x}%`,
                  top: `${e.y}%`,
                  fontSize: `${e.size}px`,
                  lineHeight: 1,
                  userSelect: "none",
                  cursor: "grab",
                  touchAction: "none",
                }}
              >
                {floats ? (
                  <span style={{
                    display: "inline-block",
                    animation: `emoji-float ${2.5 + (i % 3) * 0.5}s ease-in-out infinite ${(i % 5) * 0.4}s`,
                    pointerEvents: "none",
                  }}>
                    {e.emoji}
                  </span>
                ) : e.emoji}
              </motion.span>
            );
          })}
        </div>

        {/* Emoji palette */}
        <div className="flex justify-between px-1">
          {["❤️", "😂", "🔥", "🪳", "💯", "⭐", "💕", "🤣"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              aria-label={`הוֹסֵף ${emoji} לַקִּיר`}
              className="text-2xl min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-purple-50 active:scale-75 transition-all"
            >
              {emoji}
            </button>
          ))}
        </div>
      </section>

      {/* ── 6. Footer ──────────────────────────────────────────────────────── */}
      <footer className="mx-4 mt-6 mb-2 text-center">
        <p className="text-[11px] text-gray-500 leading-relaxed">
          כָּל הַזְּכֻיּוֹת שְׁמוּרוֹת לִי, בַּקְטוּס, וְלִי בִּלְבַד<br />
          (תִּשְׁאֲלוּ אֶת אַבָּא שֶׁלִּי)
        </p>
      </footer>

    </div>
  );
}
