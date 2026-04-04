import type { Metadata } from "next";
import DrawingCanvas from "@/components/DrawingCanvas";

export const metadata: Metadata = {
  title: "יְצִירָה",
  description: "צַיְּרוּ וְצִבְּעוּ עִם הסכתוס — כְּלִי צְבִיעָה לְיַלְדִים בַּדַּפְדְּפָן!",
  openGraph: { title: "יְצִירָה | הסכתוס", description: "צַיְּרוּ וְצִבְּעוּ עִם הסכתוס — כְּלִי צְבִיעָה לְיַלְדִים בַּדַּפְדְּפָן!" },
};

export default function DrawPage() {
  return (
    <div className="bg-[#fef6e4] min-h-screen">
      <DrawingCanvas />
    </div>
  );
}
