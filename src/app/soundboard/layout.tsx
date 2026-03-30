import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "לוּחַ צְלִילִים",
  description: "לוּחַ הַצְּלִילִים שֶׁל הסכתוס — לִחְצוּ עַל הַכַּפְתּוֹרִים וְשִׁמְעוּ אֶת הַצְּלִילִים הַמַּצְחִיקִים!",
  openGraph: { title: "לוּחַ צְלִילִים | הסכתוס", description: "לוּחַ הַצְּלִילִים שֶׁל הסכתוס — לִחְצוּ וְשִׁמְעוּ!" },
};

export default function SoundboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
