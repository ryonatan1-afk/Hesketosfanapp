import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מֶלֶךְ הַטְּרִיוִויָה",
  description: "מִשְׂחַק טְרִיוִויָה רַב-מִשְׂתַּתְּפִים שֶׁל הסכתוס — מִי יִהְיֶה מֶלֶךְ הַטְּרִיוִויָה?",
  openGraph: { title: "מֶלֶךְ הַטְּרִיוִויָה | הסכתוס", description: "מִשְׂחַק טְרִיוִויָה רַב-מִשְׂתַּתְּפִים — מִי יִהְיֶה מֶלֶךְ?" },
};

export default function TriviaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
