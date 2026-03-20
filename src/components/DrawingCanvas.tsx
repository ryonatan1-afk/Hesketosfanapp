"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Undo2, Trash2, Download } from "lucide-react";

const TEMPLATES = [1, 2, 3, 4, 5, 6];

const COLORS = [
  { hex: "#1C1C1E", label: "שחור" },
  { hex: "#EF4444", label: "אדום" },
  { hex: "#F97316", label: "כתום" },
  { hex: "#F5A820", label: "צהוב" },
  { hex: "#22C55E", label: "ירוק" },
  { hex: "#68B8ED", label: "כחול" },
  { hex: "#9090CC", label: "סגול" },
  { hex: "#EC4899", label: "ורוד" },
  { hex: "#92400E", label: "חום" },
  { hex: "#FFFFFF", label: "לבן" },
];

const BRUSH_SIZES = [4, 10, 20];

function getCanvasPos(canvas: HTMLCanvasElement, e: React.PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const undoStack = useRef<ImageData[]>([]);

  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [color, setColor] = useState("#1C1C1E");
  const [brushSize, setBrushSize] = useState(10);
  const [canUndo, setCanUndo] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  const loadTemplate = useCallback((templateNum: number) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const img = new Image();
    img.src = `/coloringpages/${templateNum}.jpg`;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      undoStack.current = [];
      setCanUndo(false);
    };
  }, [getCtx]);

  // Initialize canvas size and load first template
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    loadTemplate(selectedTemplate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load new template when selection changes (skip on first mount)
  const isFirstMount = useRef(true);
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

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    saveToUndo();
    const pos = getCanvasPos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    isDrawing.current = true;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const pos = getCanvasPos(canvas, e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function handlePointerUp() {
    isDrawing.current = false;
  }

  function handleUndo() {
    const ctx = getCtx();
    if (!ctx || undoStack.current.length === 0) return;
    const imageData = undoStack.current.pop()!;
    ctx.putImageData(imageData, 0, 0);
    setCanUndo(undoStack.current.length > 0);
  }

  function handleClear() {
    loadTemplate(selectedTemplate);
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "הציור-שלי.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] bg-lavender select-none">

      {/* Template picker */}
      <div className="flex gap-3 px-3 py-2 overflow-x-auto shrink-0 bg-lavender">
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
            <img
              src={`/coloringpages/${n}.jpg`}
              alt={`תבנית ${n}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex-1 mx-3 mb-2 rounded-3xl overflow-hidden shadow-xl bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ touchAction: "none", cursor: "crosshair" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
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

      {/* Brush sizes + actions */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 gap-3">
        {/* Brush sizes */}
        <div className="flex items-center gap-3">
          {BRUSH_SIZES.map((size) => {
            const dim = size === 4 ? 16 : size === 10 ? 24 : 34;
            return (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`rounded-full bg-white transition-all shadow ${
                  brushSize === size ? "ring-2 ring-white ring-offset-2 ring-offset-lavender scale-110" : "opacity-60"
                }`}
                style={{ width: dim, height: dim }}
              />
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 bg-white/80 text-ink font-bold px-3 py-2 rounded-2xl shadow disabled:opacity-30"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 bg-white/80 text-ink font-bold px-3 py-2 rounded-2xl shadow"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-ink text-white font-bold px-4 py-2 rounded-2xl shadow"
          >
            <Download size={18} />
            <span className="text-sm">שמור</span>
          </button>
        </div>
      </div>

    </div>
  );
}
