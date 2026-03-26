"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
type Episode = {
  guid: string;
  title: string;
  audioUrl: string;
  duration: number;
  season?: number;
  episode?: number;
};

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function PodcastPlayer({
  episodes,
  artwork,
}: {
  episodes: Episode[];
  artwork: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const [activeGuid, setActiveGuid] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const progress = duration > 0 ? currentTime / duration : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    const onEnded = () => { setPlaying(false); };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function play(ep: Episode) {
    const audio = audioRef.current;
    if (!audio) return;
    if (activeGuid === ep.guid) {
      if (playing) { audio.pause(); setPlaying(false); }
      else { audio.play(); setPlaying(true); }
    } else {
      audio.src = ep.audioUrl;
      audio.play().then(() => setPlaying(true)).catch(() => {});
      setActiveGuid(ep.guid);
      setCurrentTime(0);
      setDuration(0);
    }
  }

  function skip(sec: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + sec));
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    const bar = seekBarRef.current;
    if (!audio || !bar || !audio.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(audio.duration, ratio * audio.duration));
  }

  return (
    <div className="flex flex-col">
      <audio ref={audioRef} preload="none" />

      {/* Header */}
      <div className="flex flex-col items-center gap-3 pt-8 pb-6 px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artwork} alt="הסכתוס" className="w-28 h-28 rounded-3xl shadow-xl object-cover" />
        <h1 className="text-white text-4xl font-black">הַסְכֵּתוֹס</h1>
        <p className="text-white/70 font-bold text-base">{episodes.length} פְּרָקִים</p>
      </div>

      {/* Episode list */}
      <div className="flex flex-col gap-3 px-4">
        {episodes.length === 0 && (
          <p className="text-white/60 text-center font-bold py-12">לֹא נִמְצְאוּ פְּרָקִים</p>
        )}
        {episodes.map((ep) => {
          const isActive = activeGuid === ep.guid;
          const meta = [
            ep.season  != null && `עוֹנָה ${ep.season}`,
            ep.episode != null && `פֶּרֶק ${ep.episode}`,
            ep.duration > 0    && fmt(ep.duration),
          ].filter(Boolean).join(" · ");

          /* ── Active card ── */
          if (isActive) {
            return (
              <div
                key={ep.guid}
                className="bg-ink rounded-3xl px-4 pt-4 pb-5 shadow-md flex flex-col gap-4"
              >
                {/* Title row */}
                <div className="flex items-center gap-4" dir="ltr">
                  <div className="w-12 shrink-0" /> {/* spacer to align with inactive cards */}
                  <div className="flex-1 min-w-0" dir="rtl">
                    <p className="text-white font-bold text-base leading-snug line-clamp-2">{ep.title}</p>
                    {meta && <p className="text-white/50 text-sm mt-0.5 font-medium">{meta}</p>}
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-center gap-6" dir="ltr">
                  <button
                    onClick={() => skip(-15)}
                    aria-label="אָחוֹר 15 שְׁנִיּוֹת"
                    className="flex flex-col items-center gap-0.5 text-white/70 active:text-white transition-colors"
                  >
                    <SkipBack size={28} />
                    <span className="text-[10px] font-bold">15</span>
                  </button>

                  <button
                    onClick={() => play(ep)}
                    aria-label={playing ? "הַשְׁהָיָה" : "נְגִינָה"}
                    className="w-16 h-16 rounded-full bg-white text-ink flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                  >
                    {playing ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5" />}
                  </button>

                  <button
                    onClick={() => skip(15)}
                    aria-label="קָדִימָה 15 שְׁנִיּוֹת"
                    className="flex flex-col items-center gap-0.5 text-white/70 active:text-white transition-colors"
                  >
                    <SkipForward size={28} />
                    <span className="text-[10px] font-bold">15</span>
                  </button>
                </div>

                {/* Seek bar */}
                <div className="flex flex-col gap-1">
                  <div
                    ref={seekBarRef}
                    onClick={handleSeek}
                    dir="ltr"
                    className="h-2 bg-white/20 rounded-full cursor-pointer overflow-hidden"
                  >
                    <div
                      className="h-full bg-white/80 rounded-full transition-all duration-300"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  {/* Time labels */}
                  <div className="flex justify-between text-white/50 text-xs font-medium px-0.5" dir="ltr">
                    <span>{fmt(currentTime)}</span>
                    <span>{duration > 0 ? fmt(duration) : fmt(ep.duration)}</span>
                  </div>
                </div>
              </div>
            );
          }

          /* ── Inactive card ── */
          return (
            <div
              key={ep.guid}
              onClick={() => play(ep)}
              className="bg-white/20 rounded-3xl px-4 py-4 shadow-md cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4" dir="ltr">
                <div className="shrink-0 w-12 h-12 rounded-full bg-ink/70 text-white flex items-center justify-center shadow">
                  <Play size={20} className="translate-x-0.5" />
                </div>
                <div className="flex-1 min-w-0" dir="rtl">
                  <p className="text-white font-bold text-base leading-snug line-clamp-2">{ep.title}</p>
                  {meta && <p className="text-white/60 text-sm mt-0.5 font-medium">{meta}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
