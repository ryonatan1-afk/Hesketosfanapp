import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מִשְׂחָקִים",
  description: "מִשְׂחָקִים כֵּיפִיִּים שֶׁל הסכתוס — שִׂימוֹן, טְרִיוִויָה וְעוֹד!",
  openGraph: { title: "מִשְׂחָקִים | הסכתוס", description: "מִשְׂחָקִים כֵּיפִיִּים שֶׁל הסכתוס — שִׂימוֹן, טְרִיוִויָה וְעוֹד!" },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
