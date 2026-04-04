"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export default function TriviaLanding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/trivia/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.code) { setError(true); return; }
      localStorage.setItem(`trivia_pid_${data.code}`, data.participantId);
      trackEvent("trivia_created");
      router.push(`/trivia/${data.code}`);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fef6e4] relative flex flex-col items-center justify-center gap-8 px-6 pb-24">
      <div className="text-center">
        <div className="text-8xl mb-4">👑</div>
        <h1 className="text-5xl font-black text-[#1a1a2e] leading-tight">
          מֶלֶךְ<br />הַטְּרִיוִויָה<br /><span className="text-3xl">שֶׁל הסכתוס</span>
        </h1>
        <p className="text-gray-500 text-lg font-medium mt-2">תַּחֲרוּת טְרִיוִויָה עִם חֲבֵרִים!</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <input
          className="w-full px-4 py-4 rounded-2xl text-xl text-right text-[#1a1a2e] font-bold outline-none bg-white shadow-sm border border-[#1a1a2e]/10"
          placeholder="הַשֵּׁם שֶׁלְּךָ..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          autoFocus
        />
        {error && (
          <p className="text-red-500 text-center font-bold">שְׁגִיאָה, נַסֵּה שׁוּב</p>
        )}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="text-white font-black text-2xl py-4 rounded-2xl disabled:opacity-40 active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}
        >
          {loading ? "יוֹצֵר..." : "צוֹר תַּחֲרוּת! 👑"}
        </button>
      </div>
    </div>
  );
}
