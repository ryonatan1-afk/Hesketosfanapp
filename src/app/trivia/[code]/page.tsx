import type { Metadata } from "next";
import TriviaRoom from "@/components/TriviaRoom";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "הוזמנת לשחק! 👑 מלך הטריוויה – הסכתוס",
    description: "חידון על הפודקאסט הסכתוס. הצטרפו לתחרות עם החברים!",
    openGraph: {
      title: "הוזמנת לשחק! 👑 מלך הטריוויה – הסכתוס",
      description: "חידון על הפודקאסט הסכתוס. הצטרפו לתחרות עם החברים!",
    },
  };
}

export default async function TriviaCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <TriviaRoom code={code.toUpperCase()} />;
}
