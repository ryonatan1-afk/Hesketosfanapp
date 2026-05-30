import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "בקטוס — הפרופיל הרשמי",
  description: "בקטוס — כוכב עולה, גר מתחת למקרר. שלחו הקלטה ותוכלו לעלות לפרופיל שלי!",
  openGraph: {
    title: "בקטוס — כוכב עולה 🪳",
    description: "הפרופיל הרשמי של בקטוס מהסכתוס. שלחו הקלטה ותוכלו לעלות לפרופיל!",
    images: [{ url: "/baktus.png", width: 512, height: 512, alt: "בקטוס" }],
    type: "profile",
  },
  twitter: {
    card: "summary",
    title: "בקטוס — כוכב עולה 🪳",
    description: "הפרופיל הרשמי של בקטוס מהסכתוס.",
    images: ["/baktus.png"],
  },
};

export default function BaktusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
