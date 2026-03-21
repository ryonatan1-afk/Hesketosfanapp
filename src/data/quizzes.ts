export interface Question {
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

export interface Quiz {
  id: string;
  episodeLabel: string;
  title: string;
  questions: Question[];
}

export const quizzes: Quiz[] = [
  {
    id: "s1e1",
    episodeLabel: "עוֹנָה 1 • פֶּרֶק 1",
    title: "חִידוֹן הַפֶּרֶק הָרִאשׁוֹן",
    questions: [
      {
        question: "אֵיזוֹ חַיָּה יְשֵׁנָה הֲכִי הַרְבֵּה?",
        options: ["אַרְיֵה", "קוֹאָלָה", "כֶּלֶב", "חָתוּל"],
        correctIndex: 1,
      },
      {
        question: "כַּמָּה רַגְלַיִים יֵשׁ לְעַכָּבִישׁ?",
        options: ["4", "6", "8", "10"],
        correctIndex: 2,
      },
      {
        question: "מָה הַצֶּבַע שֶׁל הַשָּׁמַיִים בְּיוֹם בָּהִיר?",
        options: ["יָרֹק", "כָּתֹם", "סָגֹל", "כָּחֹל"],
        correctIndex: 3,
      },
      {
        question: "אֵיזוֹ חַיָּה הִיא הַמְּהִירָה בְּיוֹתֵר בָּעוֹלָם?",
        options: ["אַרְיֵה", "נָמֵר", "בַּרְדְּלָס", "סוּס"],
        correctIndex: 2,
      },
      {
        question: "כַּמָּה צְבָעִים יֵשׁ בְּקֶשֶׁת בֶּעָנָן?",
        options: ["5", "6", "7", "8"],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "s1e2",
    episodeLabel: "עוֹנָה 1 • פֶּרֶק 2",
    title: "חִידוֹן עַל הַטֶּבַע",
    questions: [
      {
        question: "מָה הַפְּרִי הַמָּתוֹק בְּיוֹתֵר?",
        options: ["לִימוֹן", "תַּפּוּז", "תָּמָר", "גְּפַרְפֶּל"],
        correctIndex: 2,
      },
      {
        question: "אֵיפֹה גָּרִים דָּגִים?",
        options: ["בְּעֵצִים", "בַּמַּיִם", "בַּחוֹל", "בָּאֲוִיר"],
        correctIndex: 1,
      },
      {
        question: "מָה עוֹשֶׂה דֹּב בַּחֹרֶף?",
        options: ["שָׁר", "שׁוֹחֶה", "מְתוּקַּק שֵׁינָה", "טָס"],
        correctIndex: 2,
      },
    ],
  },
];
