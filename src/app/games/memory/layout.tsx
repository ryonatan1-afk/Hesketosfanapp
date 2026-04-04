import { Metadata } from "next";

export const metadata: Metadata = {
  title: "מִשְׂחַק זִכָּרוֹן",
  description: "מִשְׂחַק זִכָּרוֹן עִם אֶמוֹגִ'ים שֶׁל הסכתוס — הַפְלִיפוּ קַלְפִּים וּמִצְאוּ זוּגוֹת!",
  openGraph: { title: "מִשְׂחַק זִכָּרוֹן | הסכתוס", description: "מִצְאוּ זוּגוֹת וְהַגִּיעוּ לְטוֹפ 10!" },
};

export default function MemoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
