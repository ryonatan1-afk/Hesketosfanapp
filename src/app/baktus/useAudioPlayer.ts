import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioPlayerState {
  playingId: number | null;
  progress: number; // 0–1
  elapsed: number;  // seconds
  duration: number; // seconds
}

export interface AudioPlayer extends AudioPlayerState {
  play: (id: number, url: string, onEnd?: () => void) => void;
  stop: () => void;
}

export function useAudioPlayer(): AudioPlayer {
  const audioRef         = useRef<HTMLAudioElement | null>(null);
  const onEndRef         = useRef<(() => void) | undefined>(undefined);

  const [playingId, setPlayingId] = useState<number | null>(null);
  const [progress,  setProgress]  = useState(0);
  const [elapsed,   setElapsed]   = useState(0);
  const [duration,  setDuration]  = useState(0);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.ontimeupdate    = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onended         = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    onEndRef.current = undefined;
    setPlayingId(null);
    setProgress(0);
    setElapsed(0);
    setDuration(0);
  }, []);

  const play = useCallback((id: number, url: string, onEnd?: () => void) => {
    // Toggle: tapping the active track pauses it
    if (audioRef.current && playingId === id) {
      stop();
      return;
    }

    // Stop whatever is playing
    if (audioRef.current) {
      audioRef.current.ontimeupdate    = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onended         = null;
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(url);
    audioRef.current  = audio;
    onEndRef.current  = onEnd;
    setPlayingId(id);
    setProgress(0);
    setElapsed(0);
    setDuration(0);

    audio.onloadedmetadata = () => setDuration(audio.duration);

    audio.ontimeupdate = () => {
      setProgress(audio.currentTime / (audio.duration || 1));
      setElapsed(audio.currentTime);
    };

    audio.onended = () => {
      audioRef.current = null;
      setPlayingId(null);
      setProgress(0);
      setElapsed(0);
      const cb = onEndRef.current;
      onEndRef.current = undefined;
      cb?.();
    };

    audio.play().catch(() => stop());
  }, [playingId, stop]);

  useEffect(() => () => stop(), [stop]);

  return { playingId, progress, elapsed, duration, play, stop };
}
