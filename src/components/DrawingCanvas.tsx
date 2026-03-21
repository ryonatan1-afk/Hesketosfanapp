"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Undo2, Trash2, Upload, Share2, Paintbrush, PaintBucket, ZoomIn, ZoomOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Tool = "brush" | "bucket";

const TEMPLATES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const COLORS = [
  { hex: "#1C1C1E", label: "שָׁחוֹר" },
  { hex: "#EF4444", label: "אָדֹם" },
  { hex: "#F97316", label: "כָּתֹם" },
  { hex: "#F5A820", label: "צָהֹב" },
  { hex: "#22C55E", label: "יָרֹק" },
  { hex: "#68B8ED", label: "כָּחֹל" },
  { hex: "#9090CC", label: "סָגֹל" },
  { hex: "#EC4899", label: "וָרֹד" },
  { hex: "#92400E", label: "חוּם" },
  { hex: "#FFFFFF", label: "לָבָן" },
];

const BRUSH_SIZES = [4, 10, 20];
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

// getBoundingClientRect accounts for CSS transforms, so this correctly maps
// screen pointer coordinates → canvas pixel coordinates even when zoomed/panned.
// We use clientX/Y (visual-viewport-relative) and rect.left/top (also visual-viewport-
// relative), which cancels any page scroll. The dir="ltr" on the wrapper prevents
// RTL scrollLeft from shifting the rect on iOS Safari.
function getCanvasPos(canvas: HTMLCanvasElement, e: React.PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function floodFill(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillHex: string,
  tolerance = 32
) {
  const px = Math.round(startX);
  const py = Math.round(startY);
  const width = canvas.width;
  const height = canvas.height;
  if (px < 0 || px >= width || py < 0 || py >= height) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const startIdx = (py * width + px) * 4;
  const startR = data[startIdx];
  const startG = data[startIdx + 1];
  const startB = data[startIdx + 2];
  const fill = hexToRgb(fillHex);

  // Skip if already the target color
  if (
    Math.abs(startR - fill.r) <= 5 &&
    Math.abs(startG - fill.g) <= 5 &&
    Math.abs(startB - fill.b) <= 5
  ) return;

  const visited = new Uint8Array(width * height);
  const stack: number[] = [py * width + px];
  visited[py * width + px] = 1;

  while (stack.length > 0) {
    const pixel = stack.pop()!;
    const x = pixel % width;
    const y = (pixel / width) | 0;
    const idx = pixel * 4;
    data[idx]     = fill.r;
    data[idx + 1] = fill.g;
    data[idx + 2] = fill.b;
    data[idx + 3] = 255;

    const neighbors = [
      x > 0          ? pixel - 1     : -1,
      x < width - 1  ? pixel + 1     : -1,
      y > 0          ? pixel - width : -1,
      y < height - 1 ? pixel + width : -1,
    ];
    for (const nb of neighbors) {
      if (nb < 0 || visited[nb]) continue;
      const nIdx = nb * 4;
      const dr = data[nIdx]     - startR;
      const dg = data[nIdx + 1] - startG;
      const db = data[nIdx + 2] - startB;
      if (Math.sqrt(dr * dr + dg * dg + db * db) <= tolerance) {
        visited[nb] = 1;
        stack.push(nb);
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function mid2(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export default function DrawingCanvas() {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const wrapRef       = useRef<HTMLDivElement>(null);   // the overflow-hidden container
  const isDrawing     = useRef(false);
  const undoStack     = useRef<ImageData[]>([]);
  const isFirstMount  = useRef(true);

  const dprRef        = useRef(1);

  // Pinch gesture tracking
  const ptrs          = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchDist0    = useRef<number | null>(null);
  const pinchMid0     = useRef<{ x: number; y: number } | null>(null);
  // Deferred action: position recorded on pointerDown, committed only once we
  // know it's a single-finger gesture (on first move for brush, on pointerUp for bucket)
  const pendingPos    = useRef<{ x: number; y: number } | null>(null);

  // zoom/pan stored in both refs (for sync reads in gesture handlers)
  // and state (for rendering)
  const zoomRef       = useRef(1);
  const panRef        = useRef({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan,  setPan]  = useState({ x: 0, y: 0 });

  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [color,     setColor]     = useState("#1C1C1E");
  const [brushSize, setBrushSize] = useState(10);
  const [canUndo,       setCanUndo]       = useState(false);
  const [tool,          setTool]          = useState<Tool>("brush");
  const [galleryStatus, setGalleryStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Detect native share support (files) on mount
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.share) return;
    const testFile = new File([""], "test.png", { type: "image/png" });
    setCanNativeShare(navigator.canShare?.({ files: [testFile] }) ?? true);
  }, []);

  // Keep state and refs in sync
  function applyView(newZoom: number, newPan: { x: number; y: number }) {
    zoomRef.current = newZoom;
    panRef.current  = newPan;
    setZoom(newZoom);
    setPan(newPan);
  }

  // Clamp pan so the image can't drift fully off-screen
  function clampPan(x: number, y: number, z: number): { x: number; y: number } {
    if (z <= 1) return { x: 0, y: 0 };
    const wrap = wrapRef.current;
    if (!wrap) return { x, y };
    const maxX = (wrap.offsetWidth  * (z - 1)) / 2;
    const maxY = (wrap.offsetHeight * (z - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  }, []);

  const loadTemplate = useCallback((n: number) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const img = new Image();
    img.src = `/coloringpages/${n}.svg`;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      undoStack.current = [];
      setCanUndo(false);
    };
  }, [getCtx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    canvas.width  = canvas.offsetWidth  * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    loadTemplate(selectedTemplate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    loadTemplate(selectedTemplate);
  }, [selectedTemplate, loadTemplate]);

  function saveToUndo() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    setCanUndo(true);
  }

  // ── Pointer handlers ────────────────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (ptrs.current.size === 2) {
      // Second finger arrived — cancel any pending single-finger action
      pendingPos.current = null;
      isDrawing.current  = false;
      const [a, b] = Array.from(ptrs.current.values());
      pinchDist0.current = dist2(a, b);
      pinchMid0.current  = mid2(a, b);
      return;
    }
    if (ptrs.current.size > 1) return;

    // Single pointer: capture and record position — don't draw yet
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    pendingPos.current = getCanvasPos(canvas, e);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (ptrs.current.size >= 2) {
      const [a, b] = Array.from(ptrs.current.values());
      const d   = dist2(a, b);
      const m   = mid2(a, b);
      const z0  = zoomRef.current;
      const p0  = panRef.current;

      let nextZoom = z0;
      if (pinchDist0.current && pinchDist0.current > 0) {
        nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z0 * (d / pinchDist0.current)));
      }

      let nextPan = p0;
      if (pinchMid0.current) {
        const dx = m.x - pinchMid0.current.x;
        const dy = m.y - pinchMid0.current.y;
        nextPan = clampPan(p0.x + dx, p0.y + dy, nextZoom);
      }

      applyView(nextZoom, nextPan);
      pinchDist0.current = d;
      pinchMid0.current  = m;
      return;
    }

    if (tool !== "brush") return;

    const canvas = canvasRef.current;
    const ctx    = getCtx();
    if (!canvas || !ctx) return;
    const pos = getCanvasPos(canvas, e);

    // First move with a pending start → commit the stroke now
    if (pendingPos.current && !isDrawing.current) {
      saveToUndo();
      ctx.beginPath();
      ctx.moveTo(pendingPos.current.x, pendingPos.current.y);
      ctx.strokeStyle = color;
      ctx.lineWidth   = brushSize * dprRef.current;
      ctx.lineJoin    = "round";
      ctx.lineCap     = "round";
      pendingPos.current = null;
      isDrawing.current  = true;
    }

    if (!isDrawing.current) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx    = getCtx();

    ptrs.current.delete(e.pointerId);

    // Bucket fill fires on pointer-up of a single-finger tap (pendingPos still set = no move happened)
    if (tool === "bucket" && pendingPos.current && ptrs.current.size === 0 && canvas && ctx) {
      saveToUndo();
      floodFill(canvas, ctx, pendingPos.current.x, pendingPos.current.y, color);
    }

    pendingPos.current = null;
    isDrawing.current  = false;
    if (ptrs.current.size < 2) {
      pinchDist0.current = null;
      pinchMid0.current  = null;
    }
  }

  // ── Button handlers ─────────────────────────────────────────────────────────

  function handleUndo() {
    const ctx = getCtx();
    if (!ctx || undoStack.current.length === 0) return;
    ctx.putImageData(undoStack.current.pop()!, 0, 0);
    setCanUndo(undoStack.current.length > 0);
  }

  function handleClear() {
    loadTemplate(selectedTemplate);
  }

  function getCanvasBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) return reject(new Error("no canvas"));
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("toBlob failed")), "image/png");
    });
  }

  async function handleSendToGallery() {
    if (galleryStatus === "uploading") return;
    setGalleryStatus("uploading");
    try {
      const blob = await getCanvasBlob();
      const filePath = `${crypto.randomUUID()}.png`;

      const { error: storageError } = await supabase.storage
        .from("artworks")
        .upload(filePath, blob, { contentType: "image/png", cacheControl: "3600", upsert: false });
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from("artworks").getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("artworks")
        .insert({ image_url: urlData.publicUrl });
      if (dbError) throw dbError;

      setGalleryStatus("success");
    } catch {
      setGalleryStatus("error");
    } finally {
      setTimeout(() => setGalleryStatus("idle"), 3000);
    }
  }

  async function handleShare() {
    try {
      const blob = await getCanvasBlob();
      const file = new File([blob], "הציור-שלי.png", { type: "image/png" });
      await navigator.share({ title: "הַצִּיּוּר שֶׁלִּי", files: [file] });
    } catch {
      // user cancelled or API unavailable — silent
    }
  }

  function handleZoomIn() {
    const next = Math.min(MAX_ZOOM, zoomRef.current + 0.5);
    applyView(next, clampPan(panRef.current.x, panRef.current.y, next));
  }

  function handleZoomOut() {
    const next = Math.max(MIN_ZOOM, zoomRef.current - 0.5);
    applyView(next, next === 1 ? { x: 0, y: 0 } : clampPan(panRef.current.x, panRef.current.y, next));
  }

  const cursor = tool === "bucket" ? "cell" : "crosshair";

  return (
    <div dir="ltr" className="flex flex-col h-[calc(100dvh-6rem)] bg-lavender select-none">

      {/* Template picker */}
      <div className="flex gap-3 px-3 py-2 overflow-x-auto shrink-0 bg-lavender" dir="ltr">
        {TEMPLATES.map((n) => (
          <button
            key={n}
            onClick={() => setSelectedTemplate(n)}
            className={`shrink-0 w-14 h-14 rounded-2xl overflow-hidden border-4 transition-all ${
              selectedTemplate === n
                ? "border-white scale-110 shadow-lg"
                : "border-transparent opacity-60"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/coloringpages/${n}.svg`} alt={`תַּבְנִית ${n}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Canvas + zoom overlay */}
      <div
        ref={wrapRef}
        dir="ltr"
        className="flex-1 mx-3 mb-2 relative rounded-3xl overflow-hidden shadow-xl bg-white"
      >
        {/* Zoom + pan transform wrapper */}
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            willChange: "transform",
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ touchAction: "none", cursor }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={(e) => { pendingPos.current = null; handlePointerUp(e); }}
            onPointerCancel={(e) => { pendingPos.current = null; handlePointerUp(e); }}
          />
        </div>

        {/* Zoom controls overlay — top-right corner */}
        <div className="absolute top-3 right-3 flex flex-col items-center gap-1 z-10">
          <button
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            aria-label="הַגְדֵּל"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 text-ink shadow-md transition-all active:scale-95 disabled:opacity-30"
          >
            <ZoomIn size={18} />
          </button>
          {zoom > 1 && (
            <span className="text-[10px] font-black text-ink bg-white/90 rounded-lg px-1 py-0.5 shadow leading-none">
              ×{zoom % 1 === 0 ? zoom : zoom.toFixed(1)}
            </span>
          )}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            aria-label="הַקְטֵן"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 text-ink shadow-md transition-all active:scale-95 disabled:opacity-30"
          >
            <ZoomOut size={18} />
          </button>
        </div>
      </div>

      {/* Color palette */}
      <div className="flex justify-center gap-2 px-3 py-1 shrink-0">
        {COLORS.map(({ hex, label }) => (
          <button
            key={hex}
            aria-label={label}
            onClick={() => setColor(hex)}
            className={`w-8 h-8 rounded-full transition-all shadow-sm ${
              color === hex ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-lavender" : ""
            }`}
            style={{
              backgroundColor: hex,
              border: hex === "#FFFFFF" ? "2px solid #ccc" : "none",
            }}
          />
        ))}
      </div>

      {/* Tool toggle + brush sizes + actions */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          {/* Brush */}
          <button
            onClick={() => setTool("brush")}
            aria-label="מִבְרֶשֶׁת"
            className={`flex items-center justify-center w-10 h-10 rounded-2xl shadow transition-all ${
              tool === "brush" ? "bg-ink text-white scale-110" : "bg-white/80 text-ink opacity-60"
            }`}
          >
            <Paintbrush size={20} />
          </button>

          {/* Bucket */}
          <button
            onClick={() => setTool("bucket")}
            aria-label="דְּלִי צֶבַע"
            className={`flex items-center justify-center w-10 h-10 rounded-2xl shadow transition-all ${
              tool === "bucket" ? "bg-ink text-white scale-110" : "bg-white/80 text-ink opacity-60"
            }`}
          >
            <PaintBucket size={20} />
          </button>

          {/* Brush sizes — only when brush tool active */}
          {tool === "brush" && (
            <div className="flex items-center gap-3">
              {BRUSH_SIZES.map((size) => {
                const dim = size === 4 ? 16 : size === 10 ? 24 : 34;
                return (
                  <button
                    key={size}
                    onClick={() => setBrushSize(size)}
                    className={`rounded-full bg-white transition-all shadow ${
                      brushSize === size
                        ? "ring-2 ring-white ring-offset-2 ring-offset-lavender scale-110"
                        : "opacity-60"
                    }`}
                    style={{ width: dim, height: dim }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex items-center bg-white/80 text-ink font-bold px-3 py-2 rounded-2xl shadow disabled:opacity-30"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={handleClear}
            className="flex items-center bg-white/80 text-ink font-bold px-3 py-2 rounded-2xl shadow"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={handleSendToGallery}
            disabled={galleryStatus === "uploading"}
            aria-label="שְׁלַח לְגַלֶרְיָה"
            className={`flex items-center gap-1.5 font-bold px-3 py-2 rounded-2xl shadow transition-all text-sm ${
              galleryStatus === "success" ? "bg-green-500 text-white" :
              galleryStatus === "error"   ? "bg-red-500 text-white" :
              galleryStatus === "uploading" ? "bg-white/80 text-ink opacity-60" :
              "bg-white/80 text-ink"
            }`}
          >
            <Upload size={18} />
            <span>
              {galleryStatus === "uploading" ? "שׁוֹלֵחַ..." :
               galleryStatus === "success"   ? "נִשְׁלַח!" :
               galleryStatus === "error"     ? "שְׁגִיאָה" :
               "גַּלֶרְיָה"}
            </span>
          </button>
          {canNativeShare && (
            <button
              onClick={handleShare}
              aria-label="שַׁתֵּף"
              className="flex items-center gap-1.5 bg-ink text-white font-bold px-3 py-2 rounded-2xl shadow text-sm"
            >
              <Share2 size={18} />
              <span>שַׁתֵּף</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
