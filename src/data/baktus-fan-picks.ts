export interface BaktusFanPick {
  id: number;
  rank: number;
  name: string;
  age: number;
  title: string;
  duration: string;
  audioUrl: string;
  hearts: number;
}

export const fanPicks: BaktusFanPick[] = [
  {
    id: 1,
    rank: 1,
    name: "נוֹעָה",
    age: 8,
    title: "שִׁיר לְבַקְטוּס",
    duration: "0:18",
    audioUrl: "/audio/fan-pick-1.mp3",
    hearts: 3,
  },
  {
    id: 2,
    rank: 2,
    name: "יוֹסִי",
    age: 7,
    title: "בְּדִיחָה קְצָרָה",
    duration: "0:12",
    audioUrl: "/audio/fan-pick-2.mp3",
    hearts: 2,
  },
  {
    id: 3,
    rank: 3,
    name: "מַאי",
    age: 9,
    title: "שִׁיר שֶׁלִּי לְבַקְטוּס",
    duration: "0:25",
    audioUrl: "/audio/fan-pick-3.mp3",
    hearts: 1,
  },
];
