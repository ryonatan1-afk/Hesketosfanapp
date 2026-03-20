"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import ArtworkUpload from "@/components/ArtworkUpload";

interface Artwork {
  id: string;
  image_url: string;
  created_at: string;
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.07,
      type: "spring" as const,
      stiffness: 200,
      damping: 18,
    },
  }),
};

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArtworks = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("artworks")
      .select("id, image_url, created_at")
      .order("created_at", { ascending: false });
    setArtworks(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArtworks();
  }, [fetchArtworks]);

  return (
    <div className="min-h-[80vh] bg-coral flex flex-col relative overflow-hidden">
      <div className="absolute bottom-0 inset-x-0 h-3 bg-yellow rounded-t-full" />

      <div className="flex flex-col items-center pt-8 pb-4 px-6 text-center">
        <p className="text-white/80 text-sm font-bold tracking-widest">יצירות ילדים</p>
        <h1 className="text-white text-5xl font-black leading-tight mt-1">הגלריה שלנו</h1>
      </div>

      <div className="px-4 mb-6">
        <ArtworkUpload onUploadSuccess={fetchArtworks} />
      </div>

      <div className="px-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-white/70 font-bold text-lg">טוען...</p>
          </div>
        ) : artworks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-12 text-center"
          >
            <span className="text-6xl">🎨</span>
            <p className="text-white text-xl font-black">הגלריה מחכה ליצירות שלכם!</p>
            <p className="text-white/70 font-bold">העלו ציור ויופיע כאן אחרי אישור</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {artworks.map((artwork, i) => (
                <motion.div
                  key={artwork.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="rounded-3xl overflow-hidden shadow-lg bg-white aspect-square"
                >
                  <Image
                    src={artwork.image_url}
                    alt="ציור של ילד"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
