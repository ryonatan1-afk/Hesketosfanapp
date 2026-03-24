import PodcastPlayer from "@/components/PodcastPlayer";

export type Episode = {
  guid: string;
  title: string;
  audioUrl: string;
  duration: number;
  season?: number;
  episode?: number;
};

const RSS_URL =
  "https://www.omnycontent.com/d/playlist/397b9456-4f75-4509-acff-ac0600b4a6a4/05f48c55-97c4-4049-8449-b14f00850082/e6bdb1ae-5412-42a1-a677-b14f008bbfc9/podcast.rss";

export const ARTWORK =
  "https://www.omnycontent.com/d/playlist/397b9456-4f75-4509-acff-ac0600b4a6a4/05f48c55-97c4-4049-8449-b14f00850082/e6bdb1ae-5412-42a1-a677-b14f008bbfc9/image.jpg?size=Large";

function cdata(s: string) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function tag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return m ? cdata(m[1]).trim() : "";
}

function attr(xml: string, tagName: string, attrName: string): string {
  const m = xml.match(new RegExp(`<${tagName}[^>]*\\s${attrName}="([^"]*)"`, "i"));
  return m ? m[1] : "";
}

function parseDuration(s: string): number {
  if (!s) return 0;
  const parts = s.split(":").map(Number);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

async function fetchEpisodes(): Promise<Episode[]> {
  try {
    const res = await fetch(RSS_URL, { next: { revalidate: 3600 } });
    const xml = await res.text();
    const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];
    return items
      .map((item) => ({
        guid: tag(item, "guid") || Math.random().toString(36),
        title: tag(item, "title"),
        audioUrl: attr(item, "enclosure", "url"),
        duration: parseDuration(tag(item, "itunes:duration")),
        season: tag(item, "itunes:season") ? parseInt(tag(item, "itunes:season")) : undefined,
        episode: tag(item, "itunes:episode") ? parseInt(tag(item, "itunes:episode")) : undefined,
      }))
      .filter((ep) => ep.audioUrl && ep.title);
  } catch {
    return [];
  }
}

export default async function PodcastPage() {
  const episodes = await fetchEpisodes();
  return (
    <div className="min-h-screen bg-blue relative pb-24">
      <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />
      <PodcastPlayer episodes={episodes} artwork={ARTWORK} />
    </div>
  );
}
