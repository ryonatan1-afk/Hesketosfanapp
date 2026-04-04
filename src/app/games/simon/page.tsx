"use client";

import SimonGame from "@/components/SimonGame";

export default function SimonPage() {
  const hour = new Date().getHours();
  const isQuietTime = hour >= 20 || hour < 8;

  return (
    <div className="min-h-screen bg-[#fef6e4] flex flex-col items-center relative overflow-hidden">
      <div className="flex flex-col items-center pt-5 pb-1 px-6 text-center">
        <h1 className="text-[#1a1a2e] text-4xl font-black leading-tight">סיימון</h1>
        <p className="text-gray-500 text-lg font-bold mt-0.5">חַזְרוּ אַחֲרַי!</p>
      </div>

      <SimonGame isQuietTime={isQuietTime} />
    </div>
  );
}
