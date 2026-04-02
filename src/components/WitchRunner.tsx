"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface ScoreEntry { id: string; name: string; score: number; }
type GameoverPhase = "checking" | "name-input" | "submitting" | "done";

// ─── Canvas constants ─────────────────────────────────────────────────────────
const W = 400;
const H = 520;
const GROUND_Y = 460;   // Y-coordinate of the ground line (witch's feet rest here)
const WITCH_CX = 83;    // horizontal center of witch (WITCH_X=65, +18)
const GRAVITY = 0.58;
const JUMP_VY = -14;
const BASE_SPEED = 3.5;
const MAX_SPEED = 9;

type Phase = "idle" | "playing" | "dead";

interface Obj {
  x: number;
  type: "parsley" | "zucchini";
  collected: boolean;
}

interface GS {
  witchY: number;    // Y of witch's feet
  witchVY: number;
  frame: number;
  speed: number;
  distance: number;
  score: number;
  objects: Obj[];
  spawnIn: number;
  groundOff: number;
  cloudOff: number;
  phase: Phase;
  highScore: number;
}

// ─── Drawing: background & ground ─────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D, cloudOff: number) {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, "#87CEEB");
  grad.addColorStop(1, "#C9E9F6");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, GROUND_Y);

  // Clouds (3 simple puffy shapes, parallax scroll at 0.25x speed)
  const clouds = [
    { bx: 60,  y: 60,  r: 22 },
    { bx: 220, y: 40,  r: 18 },
    { bx: 340, y: 80,  r: 20 },
  ];
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (const c of clouds) {
    const x = ((c.bx - cloudOff * 0.25) % (W + 80) + W + 80) % (W + 80) - 40;
    ctx.beginPath();
    ctx.arc(x,      c.y,      c.r,      0, Math.PI * 2);
    ctx.arc(x + 22, c.y - 8,  c.r * 0.8, 0, Math.PI * 2);
    ctx.arc(x + 42, c.y,      c.r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(ctx: CanvasRenderingContext2D, offset: number) {
  // Brown dirt strip
  ctx.fillStyle = "#8B6914";
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  // Green grass top
  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(0, GROUND_Y, W, 10);

  // Scrolling grass tufts
  ctx.fillStyle = "#2E7D32";
  for (let i = 0; i < W + 32; i += 32) {
    const x = ((i - offset) % (W + 32) + W + 32) % (W + 32) - 32;
    ctx.beginPath();
    ctx.moveTo(x,      GROUND_Y);
    ctx.lineTo(x + 4,  GROUND_Y - 9);
    ctx.lineTo(x + 8,  GROUND_Y);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 14, GROUND_Y);
    ctx.lineTo(x + 18, GROUND_Y - 7);
    ctx.lineTo(x + 22, GROUND_Y);
    ctx.fill();
  }
}

// ─── Drawing: witch ───────────────────────────────────────────────────────────
// Drawn relative to (WITCH_CX, witchY). All Y coords are negative (upward).
// Feet at (0, 0), hat tip at (0, -100). Total visual height ~100px.

function drawWitch(
  ctx: CanvasRenderingContext2D,
  witchY: number,
  frame: number,
  dead: boolean
) {
  const isAirborne = witchY < GROUND_Y - 2;
  const legSwing = isAirborne ? 6 : Math.sin(frame * 0.26) * 8;

  ctx.save();
  ctx.translate(WITCH_CX, witchY);
  if (dead) ctx.rotate(0.38);

  // ── Legs ──────────────────────────────────────────────────────────────────
  ctx.strokeStyle = "#5B2D8E";
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-7, -19); ctx.lineTo(-11 - legSwing * 0.6, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 7, -19); ctx.lineTo( 11 + legSwing * 0.6, 0); ctx.stroke();

  // ── Dress (trapezoid, wide at hem) ────────────────────────────────────────
  ctx.fillStyle = "#7B3DB5";
  ctx.beginPath();
  ctx.moveTo(-13, -45);  // shoulder L
  ctx.lineTo( 13, -45);  // shoulder R
  ctx.lineTo( 17, -19);  // hem R
  ctx.lineTo(-17, -19);  // hem L
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#5B2D8E";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Arms ──────────────────────────────────────────────────────────────────
  ctx.strokeStyle = "#FFD5A8";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  if (isAirborne) {
    // Arms up + out when jumping
    ctx.beginPath(); ctx.moveTo(-13, -40); ctx.lineTo(-23, -55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 13, -40); ctx.lineTo( 23, -55); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-13, -40); ctx.lineTo(-20, -30 + legSwing * 0.25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 13, -40); ctx.lineTo( 20, -30 - legSwing * 0.25); ctx.stroke();
  }

  // ── Head ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = "#FFD5A8";
  ctx.beginPath();
  ctx.arc(0, -58, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#E8B070";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Rosy cheeks
  if (!dead) {
    ctx.fillStyle = "rgba(240,120,110,0.30)";
    ctx.beginPath(); ctx.ellipse(-7, -55, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 7, -55, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
  }

  // ── Wild hair tufts (poking from under hat brim, both sides) ──────────────
  ctx.strokeStyle = "#C47B2B";
  ctx.lineWidth = 2.8;
  ctx.lineCap = "round";
  // Left tufts
  ctx.beginPath(); ctx.moveTo(-9, -61); ctx.quadraticCurveTo(-21, -57, -22, -49); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7, -65); ctx.quadraticCurveTo(-22, -65, -24, -58); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5, -68); ctx.quadraticCurveTo(-16, -72, -17, -64); ctx.stroke();
  // Right tufts
  ctx.beginPath(); ctx.moveTo( 9, -61); ctx.quadraticCurveTo( 21, -57,  22, -49); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 7, -65); ctx.quadraticCurveTo( 22, -65,  24, -58); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 5, -68); ctx.quadraticCurveTo( 16, -72,  17, -64); ctx.stroke();

  // ── Hat brim (flat ellipse) ────────────────────────────────────────────────
  ctx.fillStyle = "#2D1B4E";
  ctx.beginPath();
  ctx.ellipse(0, -68, 18, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Hat cone (tall triangle) ───────────────────────────────────────────────
  ctx.fillStyle = "#2D1B4E";
  ctx.beginPath();
  ctx.moveTo(  0, -102);  // tip
  ctx.lineTo(-14,  -68);  // brim L
  ctx.lineTo( 14,  -68);  // brim R
  ctx.closePath();
  ctx.fill();

  // Hat band (thin coloured stripe)
  ctx.fillStyle = "#A855F7";
  ctx.beginPath();
  ctx.moveTo(-12, -80); ctx.lineTo(12, -80);
  ctx.lineTo( 11, -86); ctx.lineTo(-11, -86);
  ctx.closePath();
  ctx.fill();

  // ── Eyes ──────────────────────────────────────────────────────────────────
  if (dead) {
    // × eyes
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6,-61); ctx.lineTo(-3,-58); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3,-61); ctx.lineTo(-6,-58); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 3,-61); ctx.lineTo( 6,-58); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 6,-61); ctx.lineTo( 3,-58); ctx.stroke();
  } else {
    ctx.fillStyle = "#222";
    ctx.beginPath(); ctx.arc(-4, -59, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 4, -59, 2.2, 0, Math.PI * 2); ctx.fill();
    // Shine dots
    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.arc(-3, -60, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 5, -60, 0.9, 0, Math.PI * 2); ctx.fill();
  }

  // ── Mouth ─────────────────────────────────────────────────────────────────
  ctx.strokeStyle = "#A0522D";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  if (dead) {
    ctx.arc(0, -51, 4,  Math.PI + 0.4, -0.4);  // frown
  } else {
    ctx.arc(0, -54, 3.5, 0.35, Math.PI - 0.35); // smile
  }
  ctx.stroke();

  ctx.restore();
}

// ─── Drawing: parsley obstacle ────────────────────────────────────────────────
// Visual box: ~36w × 50h, feet at (x, GROUND_Y)

function drawParsley(ctx: CanvasRenderingContext2D, x: number) {
  ctx.save();
  ctx.translate(x + 18, GROUND_Y);

  // Stem
  ctx.strokeStyle = "#2E7D32";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0,  0);
  ctx.lineTo(0, -22);
  ctx.stroke();

  // Leafy bush — overlapping circles
  const leaves = [
    { dx:  0,  dy: -34, r: 14 },
    { dx: -12, dy: -24, r: 10 },
    { dx:  12, dy: -24, r: 10 },
    { dx: -7,  dy: -42, r: 9  },
    { dx:  7,  dy: -42, r: 9  },
  ];
  ctx.fillStyle = "#43A047";
  for (const l of leaves) {
    ctx.beginPath(); ctx.arc(l.dx, l.dy, l.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = "#2E7D32";
  ctx.lineWidth = 1;
  for (const l of leaves) {
    ctx.beginPath(); ctx.arc(l.dx, l.dy, l.r, 0, Math.PI * 2); ctx.stroke();
  }
  // Central vein
  ctx.strokeStyle = "#1B5E20";
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, -50); ctx.stroke();

  ctx.restore();
}

// ─── Drawing: zucchini collectible ────────────────────────────────────────────
// Floats in the air — witch must jump to collect it.
const ZUCCHINI_Y = GROUND_Y - 120; // center Y; witch needs to jump to reach this

function drawZucchini(ctx: CanvasRenderingContext2D, x: number, frame: number) {
  const floatY = ZUCCHINI_Y + Math.sin(frame * 0.07) * 5; // gentle bob
  ctx.save();
  ctx.translate(x + 22, floatY);
  ctx.rotate(-0.18);

  // Body
  ctx.fillStyle = "#4CAF50";
  ctx.beginPath();
  ctx.ellipse(0, 0, 25, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Vertical stripes
  ctx.strokeStyle = "#388E3C";
  ctx.lineWidth = 2;
  for (let i = -15; i <= 15; i += 10) {
    ctx.beginPath(); ctx.moveTo(i, -10); ctx.lineTo(i - 1, 10); ctx.stroke();
  }

  // Outline
  ctx.strokeStyle = "#2E7D32";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 25, 11, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();

  // Stem + small leaf (un-rotated coords)
  ctx.save();
  ctx.translate(x + 22, floatY);
  ctx.strokeStyle = "#33691E";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(23, -7);
  ctx.quadraticCurveTo(29, -15, 27, -22);
  ctx.stroke();
  ctx.fillStyle = "#558B2F";
  ctx.beginPath();
  ctx.ellipse(26, -20, 6, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── Drawing: HUD ─────────────────────────────────────────────────────────────

function drawHUD(ctx: CanvasRenderingContext2D, score: number, speed: number) {
  // Score pill
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.rect(12, 12, 118, 40);
  ctx.fill();
  ctx.font = "bold 22px Heebo, sans-serif";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.fillText(`🥒 × ${score}`, 20, 40);

  // Speed indicator (small dots in top-right)
  const level = Math.min(5, Math.floor((speed - BASE_SPEED) / ((MAX_SPEED - BASE_SPEED) / 5)));
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath(); ctx.rect(W - 90, 12, 78, 40); ctx.fill();
  ctx.font = "12px Heebo, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "right";
  ctx.fillText("מהירות", W - 16, 26);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < level ? "#A855F7" : "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(W - 78 + i * 14, 38, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WitchRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // All mutable game state lives in one ref — no stale closures in the loop
  const gs = useRef<GS>({
    witchY: GROUND_Y,
    witchVY: 0,
    frame: 0,
    speed: BASE_SPEED,
    distance: 0,
    score: 0,
    objects: [],
    spawnIn: 70,
    groundOff: 0,
    cloudOff: 0,
    phase: "idle",
    highScore: 0,
  });

  const rafRef   = useRef(0);
  const mountRef = useRef(true);

  // React state — only for rendering the overlay UI
  const [uiPhase, setUiPhase]       = useState<Phase>("idle");
  const [uiScore, setUiScore]       = useState(0);
  const [uiHigh,  setUiHigh]        = useState(0);
  const [isNewHigh, setIsNewHigh]   = useState(false);
  const [gameoverPhase, setGameoverPhase] = useState<GameoverPhase>("checking");
  const [leaderboard, setLeaderboard]     = useState<ScoreEntry[]>([]);
  const [nameInput, setNameInput]         = useState("");
  const [newEntryId, setNewEntryId]       = useState<string | null>(null);

  // Load high score from localStorage + leaderboard on mount
  useEffect(() => {
    const stored = parseInt(localStorage.getItem("witch-runner-hs") ?? "0", 10);
    const hs = isNaN(stored) ? 0 : stored;
    gs.current.highScore = hs;
    setUiHigh(hs);
    if (navigator.onLine) {
      fetch("/api/witch-runner/scores")
        .then((r) => r.json())
        .then((data) => Array.isArray(data) && setLeaderboard(data))
        .catch(() => {});
    }
    return () => { mountRef.current = false; };
  }, []);

  async function fetchAndCheckScore(score: number) {
    if (!navigator.onLine) { setGameoverPhase("done"); return; }
    setGameoverPhase("checking");
    try {
      const data: ScoreEntry[] = await fetch("/api/witch-runner/scores").then((r) => r.json());
      setLeaderboard(Array.isArray(data) ? data : []);
      const qualifies = score > 0 && (data.length < 10 || score > data[data.length - 1].score);
      setGameoverPhase(qualifies ? "name-input" : "done");
    } catch {
      setGameoverPhase("done");
    }
  }

  async function submitScore() {
    if (!nameInput.trim()) return;
    trackEvent("witch_runner_score_submitted", { score: uiScore, name: nameInput.trim() });
    setGameoverPhase("submitting");
    try {
      const { id } = await fetch("/api/witch-runner/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim(), score: uiScore }),
      }).then((r) => r.json());
      const updated: ScoreEntry[] = await fetch("/api/witch-runner/scores").then((r) => r.json());
      setLeaderboard(Array.isArray(updated) ? updated : []);
      setNewEntryId(id ?? null);
    } catch {
      // fail silently
    }
    setGameoverPhase("done");
  }

  // ── Start / restart logic (called from event handlers only) ──────────────
  const startGame = useCallback(() => {
    const g = gs.current;
    g.witchY    = GROUND_Y;
    g.witchVY   = 0;
    g.frame     = 0;
    g.speed     = BASE_SPEED;
    g.distance  = 0;
    g.score     = 0;
    g.objects   = [];
    g.spawnIn   = 70;
    g.groundOff = 0;
    g.cloudOff  = 0;
    g.phase     = "playing";
    if (mountRef.current) {
      setUiPhase("playing");
      setUiScore(0);
      setIsNewHigh(false);
      setNameInput("");
      setNewEntryId(null);
      setGameoverPhase("checking");
    }
  }, []);

  // ── Jump / tap handler ────────────────────────────────────────────────────
  const doJump = useCallback(() => {
    const g = gs.current;
    if (g.phase === "dead") return;
    if (g.phase === "idle") { startGame(); return; }
    if (g.witchY >= GROUND_Y - 2) g.witchVY = JUMP_VY;
  }, [startGame]);

  // ── Main game loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      const g = gs.current;

      // ── Physics & game logic ────────────────────────────────────────────
      if (g.phase === "playing") {
        // Gravity + vertical movement
        g.witchVY += GRAVITY;
        g.witchY   = Math.min(g.witchY + g.witchVY, GROUND_Y);
        if (g.witchY >= GROUND_Y) g.witchVY = 0;

        g.frame++;
        g.distance  += g.speed;
        g.speed      = Math.min(BASE_SPEED + g.distance * 0.0005, MAX_SPEED);
        g.groundOff  = (g.groundOff + g.speed) % 32;
        g.cloudOff  += g.speed;

        // Move all objects
        for (const obj of g.objects) obj.x -= g.speed;

        // Witch hitbox (tight body/dress only, ignoring hat)
        const wL = WITCH_CX - 11;
        const wR = WITCH_CX + 11;
        const wT = g.witchY - 60;
        const wB = g.witchY - 6;

        for (const obj of g.objects) {
          if (obj.collected) continue;
          if (obj.type === "parsley") {
            // Parsley hitbox: x+5 → x+31, GROUND_Y-38 → GROUND_Y-5
            if (wR > obj.x + 5 && wL < obj.x + 31 && wB > GROUND_Y - 38 && wT < GROUND_Y - 5) {
              // ── Game over ────────────────────────────────────────────────
              g.phase = "dead";
              const newHigh = g.score > g.highScore;
              if (newHigh) {
                g.highScore = g.score;
                localStorage.setItem("witch-runner-hs", String(g.score));
              }
              if (mountRef.current) {
                setUiPhase("dead");
                setUiScore(g.score);
                setIsNewHigh(newHigh);
                if (newHigh) setUiHigh(g.score);
                fetchAndCheckScore(g.score);
              }
              trackEvent("witch_runner_game_over", {
                score: g.score,
                high_score: g.highScore,
                is_new_high: newHigh,
              });
            }
          } else {
            // Zucchini hitbox: x+2 → x+43, GROUND_Y-25 → GROUND_Y-3
            if (wR > obj.x + 2 && wL < obj.x + 43 && wB > ZUCCHINI_Y - 16 && wT < ZUCCHINI_Y + 16) {
              obj.collected = true;
              g.score++;
              if (mountRef.current) {
                setUiScore(g.score);
              }
            }
          }
        }

        // Remove off-screen objects
        g.objects = g.objects.filter((o) => o.x > -60);

        // Spawn next object
        g.spawnIn--;
        if (g.spawnIn <= 0) {
          const type = Math.random() < 0.44 ? "zucchini" : "parsley";
          g.objects.push({ x: W + 10, type, collected: false });
          const minGap = Math.max(36, 72 - g.speed * 3);
          const maxGap = Math.max(52, 98 - g.speed * 3);
          g.spawnIn = Math.floor(minGap + Math.random() * (maxGap - minGap));
        }
      }

      // ── Draw ─────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H);
      drawBackground(ctx, g.cloudOff);
      drawGround(ctx, g.groundOff);

      for (const obj of g.objects) {
        if (obj.type === "parsley") {
          drawParsley(ctx, obj.x);
        } else if (!obj.collected) {
          drawZucchini(ctx, obj.x, g.frame);
        }
      }

      drawWitch(ctx, g.witchY, g.frame, g.phase === "dead");

      if (g.phase === "playing" || g.phase === "dead") {
        drawHUD(ctx, g.score, g.speed);
      }

      // ── Idle title screen overlay ─────────────────────────────────────────
      if (g.phase === "idle") {
        ctx.fillStyle = "rgba(44, 10, 80, 0.42)";
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";

        ctx.font = "bold 32px Heebo, sans-serif";
        ctx.fillStyle = "white";
        ctx.fillText("הַמְּכַשֵּׁפָה הַרָּצָה", W / 2, H / 2 - 28);

        ctx.font = "18px Heebo, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText("אֱסֹף קִישׁוּאִים — הִמָּנַע מִפֶּטְרוֹזִילְיוֹן", W / 2, H / 2 + 8);

        ctx.font = "bold 20px Heebo, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText("לְחַץ לְהַתְחִיל ▶", W / 2, H / 2 + 48);
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Pointer events ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onPointer = (e: PointerEvent) => { e.preventDefault(); doJump(); };
    canvas.addEventListener("pointerdown", onPointer);
    return () => canvas.removeEventListener("pointerdown", onPointer);
  }, [doJump]);

  // ── Keyboard events ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); doJump(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doJump]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-3 px-4 pb-8 w-full">
      <div className="relative w-full max-w-[400px]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full rounded-3xl shadow-2xl border-4 border-white/30 touch-none cursor-pointer"
        />

        {/* Game-over overlay (React layer on top of canvas) */}
        <AnimatePresence>
          {uiPhase === "dead" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 rounded-3xl px-5 overflow-y-auto"
            >
              <p className="text-white text-5xl font-black">אוּיּ! 💫</p>

              <motion.p
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 14 }}
                className="text-white text-3xl font-black"
              >
                🥒 × {uiScore}
              </motion.p>

              {isNewHigh && uiScore > 0 && (
                <motion.p
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-yellow-300 text-xl font-black"
                >
                  🏆 שִׁיא חָדָשׁ!
                </motion.p>
              )}

              {/* Leaderboard flow */}
              {gameoverPhase === "checking" && (
                <Loader2 size={24} className="animate-spin text-white/60" />
              )}

              {gameoverPhase === "name-input" && (
                <div className="flex flex-col gap-2 w-full">
                  <p className="text-yellow-200 text-sm font-bold text-center">🏆 נִכְנַסְתָּ לְטוֹפ 10!</p>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitScore()}
                    placeholder="הַכְנֵס שֵׁם..."
                    maxLength={20}
                    className="w-full bg-white/20 text-white placeholder-white/40 font-bold text-center
                      rounded-2xl px-4 py-3 text-base outline-none focus:bg-white/30 transition-colors"
                    autoFocus
                  />
                  <button
                    onClick={submitScore}
                    disabled={!nameInput.trim()}
                    className="bg-white text-purple-700 font-black text-base py-3 px-6 rounded-2xl disabled:opacity-40 transition-opacity"
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
                <Loader2 size={24} className="animate-spin text-white/60" />
              )}

              {gameoverPhase === "done" && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={startGame}
                    className="mt-1 bg-purple-500 active:bg-purple-400 text-white font-black text-xl px-10 py-4 rounded-2xl shadow-xl"
                  >
                    שׁוּב פַּעַם! 🧙‍♀️
                  </motion.button>
                  {leaderboard.length > 0 && (
                    <WitchLeaderboard entries={leaderboard} highlightId={newEntryId} />
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Leaderboard below canvas when idle/playing */}
      {uiPhase !== "dead" && leaderboard.length > 0 && (
        <div className="w-full max-w-[400px]">
          <WitchLeaderboard entries={leaderboard} highlightId={null} />
        </div>
      )}
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

function WitchLeaderboard({ entries, highlightId }: { entries: ScoreEntry[]; highlightId: string | null }) {
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
            <span className="font-black text-white shrink-0">🥒 {entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
