import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "שִׂימוֹן",
  description: "מִשְׂחַק הַזִּכָּרוֹן שִׂימוֹן — עִקְבוּ אַחֲרֵי הַסֵּדֶר וְנַסּוּ לְהַגִּיעַ לַלּוּחַ הָעוֹלָמִי!",
  openGraph: { title: "שִׂימוֹן | הסכתוס", description: "מִשְׂחַק הַזִּכָּרוֹן שִׂימוֹן — הַגִּיעוּ לַלּוּחַ הָעוֹלָמִי!" },
};

export default function SimonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
