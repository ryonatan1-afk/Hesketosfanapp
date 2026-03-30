import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "פּוֹדְקַאסְט",
  description: "הַאֲזִינוּ לְהסכתוס — פּוֹדְקַאסְט לְיַלְדִים בְּסְפּוֹטִיפַיי וּבְכָל אַפְּלִיקַצְיַת הָאֲזָנָה!",
  openGraph: { title: "פּוֹדְקַאסְט | הסכתוס", description: "הַאֲזִינוּ לְהסכתוס — פּוֹדְקַאסְט לְיַלְדִים בְּסְפּוֹטִיפַיי!" },
};

const ARTWORK =
  "https://www.omnycontent.com/d/playlist/397b9456-4f75-4509-acff-ac0600b4a6a4/05f48c55-97c4-4049-8449-b14f00850082/e6bdb1ae-5412-42a1-a677-b14f008bbfc9/image.jpg?size=Large";

const SPOTIFY_URL = "https://open.spotify.com/show/51J3gxBQL2Vdj1hbYX2MfZ";

export default function PodcastPage() {
  return (
    <div className="min-h-screen bg-blue relative pb-24 flex flex-col items-center justify-center gap-8 px-6">
      <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ARTWORK}
        alt="הסכתוס פודקאסט"
        width={220}
        height={220}
        className="rounded-3xl shadow-xl"
      />

      <div className="text-center">
        <h1 className="text-4xl font-black text-white mb-2">הַסְכָּתוֹס</h1>
        <p className="text-white/80 text-lg font-medium">פּוֹדְקַאסְט לְיַלְדִים</p>
      </div>

      <a
        href={SPOTIFY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-[#1DB954] text-white font-bold text-xl rounded-full px-8 py-4 shadow-lg active:scale-95 transition-transform"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        הַאֲזִינוּ בְּסְפּוֹטִיפַיי
      </a>
    </div>
  );
}
