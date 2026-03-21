export default function PodcastPage() {
  return (
    <div className="min-h-[80vh] bg-blue flex flex-col items-center justify-center gap-6 p-6 text-center relative overflow-hidden">
      <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />
      <p className="text-white/80 text-sm font-bold tracking-widest">פּוֹדְקַאסְט לִילָדִים</p>
      <h1 className="text-white text-5xl font-black leading-tight">הַסְכֵּת</h1>
      <p className="text-white/70 text-lg font-bold">בְּקָרוֹב...</p>
    </div>
  );
}
