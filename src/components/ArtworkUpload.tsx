"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Status = "idle" | "uploading" | "success" | "error";

interface ArtworkUploadProps {
  onUploadSuccess: () => void;
}

const MAX_FILE_SIZE_MB = 5;

export default function ArtworkUpload({ onUploadSuccess }: ArtworkUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`הקובץ גדול מדי. מקסימום ${MAX_FILE_SIZE_MB} מגה-בייט.`);
      setStatus("error");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStatus("idle");
    setErrorMessage("");
  }

  async function handleSubmit() {
    if (!file) return;
    setStatus("uploading");

    const ext = file.name.split(".").pop() ?? "png";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("artworks")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (storageError) {
      setStatus("error");
      setErrorMessage("שגיאה בהעלאה. נסו שוב.");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("artworks")
      .getPublicUrl(path);

    const { error: dbError } = await supabase
      .from("artworks")
      .insert({ image_url: urlData.publicUrl });

    if (dbError) {
      setStatus("error");
      setErrorMessage("שגיאה בשמירת הציור. נסו שוב.");
      return;
    }

    setStatus("success");
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onUploadSuccess();
  }

  return (
    <div className="bg-white/20 rounded-3xl p-5 flex flex-col gap-4">
      <h2 className="text-white text-2xl font-black text-center">העלאת ציור</h2>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center gap-3 bg-white/30 hover:bg-white/40 active:scale-95 transition-all h-16 rounded-2xl text-white font-bold text-lg"
      >
        <Upload size={24} />
        <span>בחר ציור</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="rounded-2xl overflow-hidden shadow-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="תצוגה מקדימה"
              className="w-full max-h-64 object-contain bg-white"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {file && status !== "success" && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleSubmit}
            disabled={status === "uploading"}
            className="h-16 bg-ink text-white text-xl font-black rounded-2xl shadow-lg disabled:opacity-50 transition-opacity"
          >
            {status === "uploading" ? "שולח..." : "שלח"}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-green-400/30 rounded-2xl p-4"
          >
            <CheckCircle size={28} className="text-white shrink-0" />
            <p className="text-white font-bold text-lg leading-snug">
              הציור נשלח! הוא יופיע בגלריה אחרי אישור.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-red-400/30 rounded-2xl p-4"
          >
            <XCircle size={28} className="text-white shrink-0" />
            <p className="text-white font-bold text-lg">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
