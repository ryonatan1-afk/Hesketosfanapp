export interface BaktusJoke {
  id: number;
  number: number;
  title: string;
  date: string;
  episode: number;
  duration: string;
  audioUrl: string;
  views: number;
  likes: number;
  comments: number;
}

export const jokes: BaktusJoke[] = [
  {
    id: 8,
    number: 8,
    title: "פִּילִים",
    date: "22 בְּמַאי 2026",
    episode: 44,
    duration: "0:52",
    audioUrl: "/audio/baktus-joke-8.mp4",
    views: 3,
    likes: 1,
    comments: 0,
  },
  {
    id: 7,
    number: 7,
    title: "הָעַכָּבִישׁ וְהָאִישׁ",
    date: "8 בְּמַאי 2026",
    episode: 43,
    duration: "1:05",
    audioUrl: "/audio/baktus-joke-7.mp4",
    views: 2,
    likes: 0,
    comments: 0,
  },
  {
    id: 6,
    number: 6,
    title: "שְׁאֵלָה לַמַּעֲרִיצִים",
    date: "1 בְּמַאי 2026",
    episode: 42,
    duration: "0:47",
    audioUrl: "/audio/baktus-joke-6.mp4",
    views: 5,
    likes: 2,
    comments: 1,
  },
  {
    id: 5,
    number: 5,
    title: "נִסּוּי הָעַכָּבִישׁ",
    date: "17 בְּאַפְרִיל 2026",
    episode: 41,
    duration: "0:38",
    audioUrl: "/audio/baktus-joke-5.mp3",
    views: 1,
    likes: 0,
    comments: 0,
  },
  {
    id: 4,
    number: 4,
    title: "נְמָלָה עִם שֵׁן זָהָב",
    date: "10 בְּאַפְרִיל 2026",
    episode: 40,
    duration: "1:12",
    audioUrl: "/audio/baktus-joke-4.mp4",
    views: 4,
    likes: 1,
    comments: 0,
  },
  {
    id: 3,
    number: 3,
    title: "חִיפּוּשִׁית מֹשֶׁה",
    date: "3 בְּאַפְרִיל 2026",
    episode: 39,
    duration: "0:55",
    audioUrl: "/audio/baktus-joke-3.mp4",
    views: 2,
    likes: 0,
    comments: 0,
  },
  {
    id: 2,
    number: 2,
    title: "הַדְּבוֹרָה",
    date: "27 בְּמָרְץ 2026",
    episode: 38,
    duration: "0:43",
    audioUrl: "/audio/baktus-joke-2.mp4",
    views: 3,
    likes: 1,
    comments: 0,
  },
  {
    id: 1,
    number: 1,
    title: "חַרְגּוֹלִים",
    date: "13 בְּמָרְץ 2026",
    episode: 37,
    duration: "0:43",
    audioUrl: "/audio/baktus-joke-1.mp4",
    views: 5,
    likes: 3,
    comments: 0,
  },
];
