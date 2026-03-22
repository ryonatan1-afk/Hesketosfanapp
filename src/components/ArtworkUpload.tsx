"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";

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
  const [createdBy, setCreatedBy] = useState<string>("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`הַקּוֹבֶץ גָּדוֹל מִדַּי. מַקְסִימוּם ${MAX_FILE_SIZE_MB} מֶגָה-בַּיְט.`);
      setStatus("error");
      return;
    }
    trackEvent("gallery_file_selected");
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStatus("idle");
    setErrorMessage("");
  }

  async function handleSubmit() {
    if (!file) return;
    trackEvent("gallery_upload_submitted");
    setStatus("uploading");

    const ext = file.name.split(".").pop() ?? "png";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("artworks")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (storageError) {
      trackEvent("gallery_upload_error", { stage: "storage" });
      setStatus("error");
      setErrorMessage("שְׁגִיאָה בְּהַעֲלָאָה. נַסּוּ שׁוּב.");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("artworks")
      .getPublicUrl(path);

    const { error: dbError } = await supabase
      .from("artworks")
      .insert({ image_url: urlData.publicUrl, created_by: createdBy.trim() || null });

    if (dbError) {
      trackEvent("gallery_upload_error", { stage: "database" });
      setStatus("error");
      setErrorMessage("שְׁגִיאָה בִּשְׁמִירַת הַצִּיּוּר. נַסּוּ שׁוּב.");
      return;
    }

    trackEvent("gallery_upload_success");
    setStatus("success");
    setFile(null);
    setPreview(null);
    setCreatedBy("");
    if (inputRef.current) inputRef.current.value = "";
    onUploadSuccess();
  }

  return (
    <div className="bg-white/20 rounded-3xl p-5 flex flex-col gap-4">
      <h2 className="text-white text-2xl font-black text-center">הַעֲלָאַת צִיּוּר</h2>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center gap-3 bg-white/30 hover:bg-white/40 active:scale-95 transition-all h-16 rounded-2xl text-white font-bold text-lg"
      >
        <Upload size={24} />
        <span>בְּחַר צִיּוּר</span>
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
              alt="תַּצּוּגָה מַקְדִּימָה"
              className="w-full max-h-64 object-contain bg-white"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="text"
        value={createdBy}
        onChange={(e) => setCreatedBy(e.target.value)}
        placeholder="שֵׁם הַיּוֹצֵר (לֹא חוֹבָה)"
        maxLength={40}
        className="h-14 rounded-2xl px-4 text-lg font-bold text-right bg-white/30 text-white placeholder:text-white/60 outline-none focus:bg-white/40 transition-colors"
      />

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
            {status === "uploading" ? "שׁוֹלֵחַ..." : "שְׁלַח"}
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
              הַצִּיּוּר נִשְׁלַח! הוּא יוֹפִיעַ בַּגַּלֶרְיָה אַחֲרֵי אִישׁוּר.
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
