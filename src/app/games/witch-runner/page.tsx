"use client";

import WitchRunner from "@/components/WitchRunner";

export default function WitchRunnerPage() {
  return (
    <div className="min-h-screen bg-purple-600 flex flex-col relative overflow-hidden">
      <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />

      <div className="flex flex-col items-center pt-8 pb-2 px-6 text-center">
        <h1 className="text-white text-4xl font-black leading-tight">הַמְּכַשֵּׁפָה הַרָּצָה</h1>
        <p className="text-white/80 text-base font-bold mt-1">אֱסֹף קִישׁוּאִים, הִמָּנַע מִפֶּטְרוֹזִילְיוֹן! 🥒🌿</p>
      </div>

      <WitchRunner />
    </div>
  );
}
