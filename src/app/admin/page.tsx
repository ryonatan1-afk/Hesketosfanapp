"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Trash2, Lock } from "lucide-react";

interface Artwork {
  id: string;
  image_url: string;
  created_at: string;
  approved: boolean;
  created_by: string | null;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchArtworks = useCallback(async (pw: string) => {
    setLoading(true);
    const res = await fetch("/api/admin/artworks", {
      headers: { "x-admin-password": pw },
    });
    if (res.ok) {
      setArtworks(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_pw");
    if (saved) { setAuthed(true); fetchArtworks(saved); }
  }, [fetchArtworks]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/artworks", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      sessionStorage.setItem("admin_pw", password);
      setAuthed(true);
      setArtworks(await res.json());
    } else {
      setError("סִיסְמָה שְׁגוּיָה");
    }
  }

  async function approve(id: string) {
    const pw = sessionStorage.getItem("admin_pw")!;
    await fetch("/api/admin/artworks", {
      method: "PATCH",
      headers: { "x-admin-password": pw, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setArtworks((prev) => prev.map((a) => a.id === id ? { ...a, approved: true } : a));
  }

  async function remove(id: string) {
    const pw = sessionStorage.getItem("admin_pw")!;
    await fetch("/api/admin/artworks", {
      method: "DELETE",
      headers: { "x-admin-password": pw, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setArtworks((prev) => prev.filter((a) => a.id !== id));
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center p-6 gap-6">
        <Lock size={48} className="text-white/40" />
        <h1 className="text-white text-3xl font-black">נִיהוּל גַּלֶרְיָה</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-xs">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סִיסְמָה"
            className="h-14 rounded-2xl px-4 text-lg font-bold text-center bg-white/10 text-white placeholder:text-white/30 border border-white/20 outline-none focus:border-white/60"
          />
          {error && <p className="text-red-400 font-bold text-center">{error}</p>}
          <button
            type="submit"
            className="h-14 bg-coral rounded-2xl text-white font-black text-xl"
          >
            כְּנִיסָה
          </button>
        </form>
      </div>
    );
  }

  const pending = artworks.filter((a) => !a.approved);
  const approved = artworks.filter((a) => a.approved);

  return (
    <div className="min-h-screen bg-ink flex flex-col p-4 pb-8">
      <h1 className="text-white text-3xl font-black text-center py-6">נִיהוּל גַּלֶרְיָה</h1>

      {loading ? (
        <p className="text-white/50 text-center font-bold">טוֹעֵן...</p>
      ) : (
        <>
          {/* Pending section */}
          <h2 className="text-coral font-black text-xl mb-3">
            מְמַתִּינִים לְאִישׁוּר ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="text-white/40 font-bold mb-6">אֵין צִיּוּרִים מְמַתִּינִים</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-8">
              <AnimatePresence>
                {pending.map((artwork) => (
                  <ArtworkCard
                    key={artwork.id}
                    artwork={artwork}
                    onApprove={() => approve(artwork.id)}
                    onDelete={() => remove(artwork.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Approved section */}
          <h2 className="text-green-400 font-black text-xl mb-3">
            מְאוּשָׁרִים ({approved.length})
          </h2>
          {approved.length === 0 ? (
            <p className="text-white/40 font-bold">אֵין צִיּוּרִים מְאוּשָׁרִים עֲדַיִן</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence>
                {approved.map((artwork) => (
                  <ArtworkCard
                    key={artwork.id}
                    artwork={artwork}
                    onDelete={() => remove(artwork.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}

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
        <Image
          src={artwork.image_url}
          alt="צִיּוּר"
          fill
          className="object-cover"
        />
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
