"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type Platform = "ios" | "android" | null;

type BeforeInstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "install-dismissed-at";
const DISMISS_DAYS = 7;

function detectPlatform(): Platform {
  if (typeof window === "undefined") return null;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  if (standalone) return null;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return null;
}

function wasDismissedRecently(): boolean {
  try {
    const stored = localStorage.getItem(DISMISS_KEY);
    if (!stored) return false;
    return Date.now() - Number(stored) < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

export default function InstallBanner() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (wasDismissedRecently()) return;
    const p = detectPlatform();
    if (!p) return;
    setPlatform(p);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const show = () => setVisible(true);
    window.addEventListener("click", show, { once: true });
    window.addEventListener("touchstart", show, { once: true });

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("click", show);
      window.removeEventListener("touchstart", show);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
  }

  const canShow =
    platform === "ios" ||
    (platform === "android" && deferredPrompt !== null);

  return (
    <AnimatePresence>
      {visible && canShow && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className="fixed bottom-6 inset-x-3 z-50 bg-white rounded-3xl shadow-2xl border border-black/10 p-5"
        >
          <button
            onClick={dismiss}
            aria-label="סְגוֹר"
            className="absolute top-3 left-3 text-gray-400 p-1 rounded-full"
          >
            <X size={18} />
          </button>

          {platform === "ios" && (
            <div className="flex flex-col gap-2 text-right pr-1">
              <p className="text-ink font-black text-lg">📲 הוֹסִיפוּ לְמַסָּךְ הַבַּיִת!</p>
              <p className="text-gray-500 text-sm font-bold leading-relaxed">
                לִחְצוּ עַל{" "}
                <span className="inline-flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-0.5 font-black text-xs text-ink">
                  📤 שִׁיתוּף
                </span>
                {" "}וְאַחַר כָּךְ עַל{" "}
                <span className="font-black text-ink">״הוֹסֵף לְמַסָּךְ הַבַּיִת״</span>
              </p>
            </div>
          )}

          {platform === "android" && (
            <div className="flex items-center justify-between gap-3 pr-1">
              <p className="text-ink font-black text-base">📲 הוֹסִיפוּ לְמַסָּךְ הַבַּיִת!</p>
              <button
                onClick={handleInstall}
                className="bg-blue text-white font-black text-sm px-5 py-2.5 rounded-2xl shrink-0"
              >
                הוֹסָפָה
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
