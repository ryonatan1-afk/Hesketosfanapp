"use client";

import SimonGame from "@/components/SimonGame";

export default function SimonPage() {
  const hour = new Date().getHours();
  const isQuietTime = hour >= 20 || hour < 8;

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center relative overflow-hidden">
      <div className="flex flex-col items-center pt-5 pb-1 px-6 text-center">
        <h1 className="text-white text-4xl font-black leading-tight">סיימון</h1>
        <p className="text-white/60 text-lg font-bold mt-0.5">חַזְרוּ אַחֲרַי!</p>
      </div>

      <SimonGame isQuietTime={isQuietTime} />
    </div>
  );
}
