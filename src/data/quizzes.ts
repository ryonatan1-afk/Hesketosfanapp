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
    episodeLabel: "עונה 1 • פרק 1",
    title: "חידון הפרק הראשון",
    questions: [
      {
        question: "איזו חיה ישנה הכי הרבה?",
        options: ["אריה", "קואלה", "כלב", "חתול"],
        correctIndex: 1,
      },
      {
        question: "כמה רגליים יש לעכביש?",
        options: ["4", "6", "8", "10"],
        correctIndex: 2,
      },
      {
        question: "מה הצבע של השמיים ביום בהיר?",
        options: ["ירוק", "כתום", "סגול", "כחול"],
        correctIndex: 3,
      },
      {
        question: "איזו חיה היא המהירה ביותר בעולם?",
        options: ["אריה", "נמר", "ברדלס", "סוס"],
        correctIndex: 2,
      },
      {
        question: "כמה צבעים יש בקשת בענן?",
        options: ["5", "6", "7", "8"],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "s1e2",
    episodeLabel: "עונה 1 • פרק 2",
    title: "חידון על הטבע",
    questions: [
      {
        question: "מה הפרי המתוק ביותר?",
        options: ["לימון", "תפוז", "תמר", "גפרפל"],
        correctIndex: 2,
      },
      {
        question: "איפה גרים דגים?",
        options: ["בעצים", "במים", "בחול", "באוויר"],
        correctIndex: 1,
      },
      {
        question: "מה עושה דב בחורף?",
        options: ["שר", "שוחה", "מתוקק שינה", "טס"],
        correctIndex: 2,
      },
    ],
  },
];
