"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Trash2, Lock, Play, Pause, Mic } from "lucide-react";

interface Artwork {
  id: string;
  image_url: string;
  created_at: string;
  approved: boolean;
  created_by: string | null;
}

interface Recording {
  id: string;
  name: string;
  audio_url: string;
  signed_url: string | null;
  approved: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const [activeTab, setActiveTab] = useState<"artworks" | "recordings">("artworks");
  const [artworks,   setArtworks]   = useState<Artwork[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchAll = useCallback(async (pw: string) => {
    setLoading(true);
    const [artRes, recRes] = await Promise.all([
      fetch("/api/admin/artworks",   { headers: { "x-admin-password": pw } }),
      fetch("/api/admin/recordings", { headers: { "x-admin-password": pw } }),
    ]);
    if (artRes.ok) setArtworks(await artRes.json());
    if (recRes.ok) setRecordings(await recRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_pw");
    if (saved) { setAuthed(true); fetchAll(saved); }
  }, [fetchAll]);

  // Stop audio on unmount
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/artworks", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      sessionStorage.setItem("admin_pw", password);
      setAuthed(true);
      fetchAll(password);
    } else {
      setError("סִיסְמָה שְׁגוּיָה");
    }
  }

  // ── Artwork actions ──────────────────────────────────────────────────────────

  async function approveArtwork(id: string) {
    const pw = sessionStorage.getItem("admin_pw")!;
    await fetch("/api/admin/artworks", {
      method: "PATCH",
      headers: { "x-admin-password": pw, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setArtworks(prev => prev.map(a => a.id === id ? { ...a, approved: true } : a));
  }

  async function removeArtwork(id: string) {
    const pw = sessionStorage.getItem("admin_pw")!;
    await fetch("/api/admin/artworks", {
      method: "DELETE",
      headers: { "x-admin-password": pw, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setArtworks(prev => prev.filter(a => a.id !== id));
  }

  // ── Recording actions ────────────────────────────────────────────────────────

  function togglePlay(rec: Recording) {
    if (!rec.signed_url) return;
    if (playingId === rec.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(rec.signed_url);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
    setPlayingId(rec.id);
  }

  async function approveRecording(id: string) {
    const pw = sessionStorage.getItem("admin_pw")!;
    await fetch("/api/admin/recordings", {
      method: "PATCH",
      headers: { "x-admin-password": pw, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRecordings(prev => prev.map(r => r.id === id ? { ...r, approved: true } : r));
  }

  async function removeRecording(id: string) {
    const pw = sessionStorage.getItem("admin_pw")!;
    if (playingId === id) { audioRef.current?.pause(); setPlayingId(null); }
    await fetch("/api/admin/recordings", {
      method: "DELETE",
      headers: { "x-admin-password": pw, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRecordings(prev => prev.filter(r => r.id !== id));
  }

  // ── Login screen ─────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center p-6 gap-6">
        <Lock size={48} className="text-white/40" />
        <h1 className="text-white text-3xl font-black">נִיהוּל</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-xs">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סִיסְמָה"
            className="h-14 rounded-2xl px-4 text-lg font-bold text-center bg-white/10 text-white placeholder:text-white/30 border border-white/20 outline-none focus:border-white/60"
          />
          {error && <p className="text-red-400 font-bold text-center">{error}</p>}
          <button type="submit" className="h-14 bg-coral rounded-2xl text-white font-black text-xl">
            כְּנִיסָה
          </button>
        </form>
      </div>
    );
  }

  // ── Main panel ───────────────────────────────────────────────────────────────

  const pendingArtworks  = artworks.filter(a => !a.approved);
  const approvedArtworks = artworks.filter(a =>  a.approved);
  const pendingRec       = recordings.filter(r => !r.approved);
  const approvedRec      = recordings.filter(r =>  r.approved);

  return (
    <div className="min-h-screen bg-ink flex flex-col p-4 pb-8">
      <h1 className="text-white text-3xl font-black text-center py-6">נִיהוּל</h1>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("artworks")}
          className={`flex-1 py-3 rounded-2xl font-black text-base transition-colors ${
            activeTab === "artworks" ? "bg-coral text-white" : "bg-white/10 text-white/50"
          }`}
        >
          צִיּוּרִים ({artworks.length})
        </button>
        <button
          onClick={() => setActiveTab("recordings")}
          className={`flex-1 py-3 rounded-2xl font-black text-base transition-colors relative ${
            activeTab === "recordings" ? "bg-[#68B8ED] text-white" : "bg-white/10 text-white/50"
          }`}
        >
          הֶקְלָטוֹת ({recordings.length})
          {pendingRec.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-black flex items-center justify-center">
              {pendingRec.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        activeTab === "artworks" ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonArtwork key={i} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonRecording key={i} />)}
          </div>
        )
      ) : (
        <>
          {/* ── Artworks tab ── */}
          {activeTab === "artworks" && (
            <>
              <h2 className="text-coral font-black text-xl mb-3">
                מְמַתִּינִים לְאִישׁוּר ({pendingArtworks.length})
              </h2>
              {pendingArtworks.length === 0 ? (
                <p className="text-white/40 font-bold mb-6">אֵין צִיּוּרִים מְמַתִּינִים</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <AnimatePresence>
                    {pendingArtworks.map(a => (
                      <ArtworkCard
                        key={a.id}
                        artwork={a}
                        onApprove={() => approveArtwork(a.id)}
                        onDelete={() => removeArtwork(a.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              <h2 className="text-green-400 font-black text-xl mb-3">
                מְאוּשָׁרִים ({approvedArtworks.length})
              </h2>
              {approvedArtworks.length === 0 ? (
                <p className="text-white/40 font-bold">אֵין צִיּוּרִים מְאוּשָׁרִים עֲדַיִן</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <AnimatePresence>
                    {approvedArtworks.map(a => (
                      <ArtworkCard key={a.id} artwork={a} onDelete={() => removeArtwork(a.id)} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          {/* ── Recordings tab ── */}
          {activeTab === "recordings" && (
            <>
              <h2 className="text-[#68B8ED] font-black text-xl mb-3">
                מְמַתִּינִים לְאִישׁוּר ({pendingRec.length})
              </h2>
              {pendingRec.length === 0 ? (
                <p className="text-white/40 font-bold mb-6">אֵין הֶקְלָטוֹת מְמַתִּינוֹת</p>
              ) : (
                <div className="flex flex-col gap-3 mb-8">
                  <AnimatePresence>
                    {pendingRec.map(r => (
                      <RecordingCard
                        key={r.id}
                        recording={r}
                        playing={playingId === r.id}
                        onTogglePlay={() => togglePlay(r)}
                        onApprove={() => approveRecording(r.id)}
                        onDelete={() => removeRecording(r.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              <h2 className="text-green-400 font-black text-xl mb-3">
                מְאוּשָׁרִים ({approvedRec.length})
              </h2>
              {approvedRec.length === 0 ? (
                <p className="text-white/40 font-bold">אֵין הֶקְלָטוֹת מְאוּשָׁרוֹת עֲדַיִן</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {approvedRec.map(r => (
                      <RecordingCard
                        key={r.id}
                        recording={r}
                        playing={playingId === r.id}
                        onTogglePlay={() => togglePlay(r)}
                        onDelete={() => removeRecording(r.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── ArtworkCard ───────────────────────────────────────────────────────────────

function ArtworkCard({
  artwork,
  onApprove,
  onDelete,
}: {
  artwork: Artwork;
  onApprove?: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="rounded-2xl overflow-hidden bg-white/10 flex flex-col"
    >
      <div className="aspect-square relative">
        <Image src={artwork.image_url} alt="צִיּוּר" fill className="object-cover" />
      </div>
      {artwork.created_by && (
        <p className="text-white/60 text-xs font-bold text-center px-2 pt-1 truncate">
          מאת {artwork.created_by}
        </p>
      )}
      <div className="flex gap-2 p-2">
        {onApprove && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white font-black text-sm h-10 rounded-xl"
          >
            <CheckCircle size={16} />
            <span>אַשֵּׁר</span>
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1 bg-red-500 text-white font-black text-sm h-10 rounded-xl"
        >
          <Trash2 size={16} />
          <span>מְחַק</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── RecordingCard ─────────────────────────────────────────────────────────────

function RecordingCard({
  recording,
  playing,
  onTogglePlay,
  onApprove,
  onDelete,
}: {
  recording: Recording;
  playing: boolean;
  onTogglePlay: () => void;
  onApprove?: () => void;
  onDelete: () => void;
}) {
  const date = new Date(recording.created_at).toLocaleDateString("he-IL", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white/10 rounded-2xl p-4 flex items-center gap-3"
    >
      <button
        onClick={onTogglePlay}
        disabled={!recording.signed_url}
        aria-label={playing ? "עֲצוֹר" : "נַגֵּן"}
        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 ${
          playing ? "bg-[#68B8ED]" : "bg-white/20 hover:bg-white/30"
        }`}
      >
        {playing
          ? <Pause size={18} fill="white" className="text-white" />
          : <Play  size={18} fill="white" className="text-white translate-x-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Mic size={13} className="text-[#68B8ED] flex-shrink-0" />
          <p className="font-black text-white truncate">{recording.name}</p>
        </div>
        <p className="text-white/40 text-xs mt-0.5">{date}</p>
        {playing && (
          <p className="text-[#68B8ED] text-xs font-bold mt-0.5 animate-pulse">מְנַגֵּן...</p>
        )}
      </div>

      <div className="flex gap-2 flex-shrink-0">
        {onApprove && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onApprove}
            aria-label="אַשֵּׁר"
            className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center"
          >
            <CheckCircle size={18} className="text-white" />
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onDelete}
          aria-label="מְחַק"
          className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center"
        >
          <Trash2 size={18} className="text-white" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────

function SkeletonArtwork() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white/10 flex flex-col animate-pulse">
      <div className="aspect-square bg-white/20" />
      <div className="flex gap-2 p-2">
        <div className="flex-1 h-10 bg-white/20 rounded-xl" />
        <div className="flex-1 h-10 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonRecording() {
  return (
    <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-white/20 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/20 rounded-full w-3/4" />
        <div className="h-3 bg-white/10 rounded-full w-1/2" />
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <div className="w-10 h-10 bg-white/20 rounded-xl" />
        <div className="w-10 h-10 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}
