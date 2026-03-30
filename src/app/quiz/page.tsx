import type { Metadata } from "next";
import QuizPlayer from "@/components/QuizPlayer";

export const metadata: Metadata = {
  title: "חִידוֹן",
  description: "חִידוֹן טְרִיוִויָה לְיַלְדֵי הסכתוס — כַּמָּה אַתֶּם יוֹדְעִים?",
  openGraph: { title: "חִידוֹן | הסכתוס", description: "חִידוֹן טְרִיוִויָה לְיַלְדֵי הסכתוס — כַּמָּה אַתֶּם יוֹדְעִים?" },
};

export default function QuizPage() {
  return <QuizPlayer />;
}
