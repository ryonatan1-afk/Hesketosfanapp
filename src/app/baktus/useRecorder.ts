"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "recording" | "recorded" | "error";

export interface RecorderResult {
  status: RecorderStatus;
  countdown: number;
  audioUrl: string | null;
  blob: Blob | null;
  errorMsg: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

const MAX_SECONDS = 30;

export function useRecorder(): RecorderResult {
  const [status,    setStatus]    = useState<RecorderStatus>("idle");
  const [countdown, setCountdown] = useState(MAX_SECONDS);
  const [audioUrl,  setAudioUrl]  = useState<string | null>(null);
  const [blob,      setBlob]      = useState<Blob | null>(null);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);

  const mrRef       = useRef<MediaRecorder | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const tickRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (tickRef.current)     { clearInterval(tickRef.current);    tickRef.current    = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => {
    clearTimers();
    stopStream();
    if (mrRef.current) {
      mrRef.current.ondataavailable = null;
      mrRef.current.onstop = null;
      if (mrRef.current.state !== "inactive") mrRef.current.stop();
      mrRef.current = null;
    }
  }, [clearTimers, stopStream]);

  const stop = useCallback(() => {
    clearTimers();
    if (mrRef.current && mrRef.current.state !== "inactive") {
      mrRef.current.stop(); // triggers onstop → transitions to "recorded"
    }
  }, [clearTimers]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setErrorMsg("הַדַּפְדְּפָן שֶׁלְּךָ אֵינוֹ תּוֹמֵךְ בְּהַקְלָטָה. נַסּוּ דַּפְדְּפָן אַחֵר 😔");
      setStatus("error");
      return;
    }

    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mrRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        stopStream();
        clearTimers();
        const b = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const url = URL.createObjectURL(b);
        setBlob(b);
        setAudioUrl(url);
        setStatus("recorded");
      };

      mr.start(100);
      setStatus("recording");

      let rem = MAX_SECONDS;
      setCountdown(rem);

      tickRef.current = setInterval(() => {
        rem -= 1;
        setCountdown(rem);
        if (rem <= 0) clearTimers();
      }, 1000);

      autoStopRef.current = setTimeout(() => {
        if (mrRef.current?.state !== "inactive") mrRef.current?.stop();
      }, MAX_SECONDS * 1000);

    } catch (err) {
      stopStream();
      clearTimers();
      const name = (err as Error).name;
      setErrorMsg(
        name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "לֹא אִישַׁרְתֶּם גִּישָׁה לַמִּיקְרוֹפוֹן. אֲנָא אִשְׁרוּ בְּהַגְדְּרוֹת הַדַּפְדְּפָן 🎙️"
          : "שְׁגִיאָה בְּהַפְעָלַת הַמִּיקְרוֹפוֹן. נַסּוּ שׁוּב 😔"
      );
      setStatus("error");
    }
  }, [clearTimers, stopStream]);

  const reset = useCallback(() => {
    clearTimers();
    stopStream();
    mrRef.current = null;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setStatus("idle");
    setCountdown(MAX_SECONDS);
    setAudioUrl(null);
    setBlob(null);
    setErrorMsg(null);
  }, [audioUrl, clearTimers, stopStream]);

  return { status, countdown, audioUrl, blob, errorMsg, start, stop, reset };
}
