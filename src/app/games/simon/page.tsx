"use client";

import SimonGame from "@/components/SimonGame";

export default function SimonPage() {
  const hour = new Date().getHours();
  const isQuietTime = hour >= 20 || hour < 8;

  return (
    <div className="min-h-screen bg-lavender flex flex-col items-center relative overflow-hidden">
      <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />

      <div className="flex flex-col items-center pt-10 pb-2 px-6 text-center">
        <h1 className="text-white text-5xl font-black leading-tight">סיימון</h1>
        <p className="text-white/80 text-xl font-bold mt-1">חַזְרוּ אַחֲרַי!</p>
      </div>

      <SimonGame isQuietTime={isQuietTime} />
    </div>
  );
}
