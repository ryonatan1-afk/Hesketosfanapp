"use client";

import WitchRunner from "@/components/WitchRunner";

export default function WitchRunnerPage() {
  return (
    <div className="min-h-screen bg-[#fef6e4] flex flex-col relative overflow-hidden">
      <div className="flex flex-col items-center pt-8 pb-2 px-6 text-center">
        <h1 className="text-[#1a1a2e] text-4xl font-black leading-tight">הַמְּכַשֵּׁפָה הַרָּצָה</h1>
        <p className="text-gray-500 text-base font-bold mt-1">אֱסֹף קִישׁוּאִים, הִמָּנַע מִפֶּטְרוֹזִילְיוֹן! 🥒🌿</p>
      </div>

      <WitchRunner />
    </div>
  );
}
