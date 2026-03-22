/**
 * Quiz CSV Importer
 *
 * Usage:
 *   node scripts/import-quiz.mjs path/to/questions.csv
 *
 * CSV format (UTF-8, comma or semicolon delimited):
 *   episode, question, option_a, option_b, option_c, option_d, correct
 *
 * - episode:  e.g. s1e1, s2e3
 * - correct:  a / b / c / d  (which option is the right answer)
 *
 * The script merges imported quizzes into src/data/quizzes.ts.
 * Existing quizzes with the same episode ID are replaced.
 * All other quizzes are preserved.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUIZZES_PATH = resolve(__dirname, "../src/data/quizzes.ts");

// ---------------------------------------------------------------------------
// CSV parser — handles quoted fields, comma or semicolon delimiter, BOM
// ---------------------------------------------------------------------------
function detectDelimiter(firstLine) {
  const commas = (firstLine.match(/,/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  return semis > commas ? ";" : ",";
}

function parseRow(line, delimiter) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(raw) {
  // Strip UTF-8 BOM and normalize line endings
  const text = raw.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const lines = text.trim().split("\n").filter(Boolean);
  const delimiter = detectDelimiter(lines[0]);
  const headers = parseRow(lines[0], delimiter).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const values = parseRow(line, delimiter);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function episodeLabelFromId(id) {
  const m = id.match(/^s(\d+)e(\d+)$/i);
  if (!m) return id;
  return `עוֹנָה ${m[1]} • פֶּרֶק ${m[2]}`;
}

const CORRECT_MAP = {
  a: 0, b: 1, c: 2, d: 3,
  "1": 0, "2": 1, "3": 2, "4": 3,
  "אפשרות א'": 0, "אפשרות ב'": 1, "אפשרות ג'": 2, "אפשרות ד'": 3,
  "א'": 0, "ב'": 1, "ג'": 2, "ד'": 3,
  "א": 0, "ב": 1, "ג": 2, "ד": 3,
};

function rowsToQuiz(id, rows, episodeTitle) {
  const questions = rows.map((row, idx) => {
    const correct = (row.correct || "").toLowerCase().trim();
    const correctIndex = CORRECT_MAP[correct];
    if (correctIndex === undefined) {
      throw new Error(
        `Row ${idx + 1} of episode "${id}": invalid 'correct' value "${row.correct}" — must be a, b, c, or d`
      );
    }
    const options = [row.option_a, row.option_b, row.option_c, row.option_d];
    if (options.some((o) => !o)) {
      throw new Error(
        `Row ${idx + 1} of episode "${id}": one or more option columns are empty`
      );
    }
    return { question: row.question, options, correctIndex };
  });

  return {
    id,
    episodeLabel: episodeLabelFromId(id),
    title: episodeTitle || "חִידוֹן עַל הַפֶּרֶק",
    questions,
  };
}

// ---------------------------------------------------------------------------
// TypeScript serializer
// ---------------------------------------------------------------------------
function serializeString(s) {
  // Use JSON stringify for safe escaping, but keep Hebrew as-is
  return JSON.stringify(s);
}

function serializeQuiz(quiz) {
  const questions = quiz.questions
    .map((q) => {
      const opts = q.options.map((o) => `          ${serializeString(o)}`).join(",\n");
      return `      {
        question: ${serializeString(q.question)},
        options: [
${opts},
        ],
        correctIndex: ${q.correctIndex},
      }`;
    })
    .join(",\n");

  return `  {
    id: ${serializeString(quiz.id)},
    episodeLabel: ${serializeString(quiz.episodeLabel)},
    title: ${serializeString(quiz.title)},
    questions: [
${questions},
    ],
  }`;
}

function serializeQuizzes(quizzes) {
  const body = quizzes.map(serializeQuiz).join(",\n");
  return `export interface Question {
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
${body},
];\n`;
}

// ---------------------------------------------------------------------------
// Read existing quizzes from quizzes.ts using eval (safe — our own file)
// ---------------------------------------------------------------------------
function extractExistingQuizzes() {
  const src = readFileSync(QUIZZES_PATH, "utf-8");
  // Extract the array literal and eval it in a controlled way
  const match = src.match(/export const quizzes[^=]*=\s*(\[[\s\S]*\]);\s*$/);
  if (!match) return [];
  try {
    // eslint-disable-next-line no-eval
    return eval(match[1]);
  } catch {
    console.warn("⚠️  Could not parse existing quizzes — they will be replaced entirely.");
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/import-quiz.mjs path/to/questions.csv");
  process.exit(1);
}

const raw = readFileSync(resolve(csvPath), "utf-8");
const rows = parseCSV(raw);

if (!rows.length) {
  console.error("No rows found in CSV.");
  process.exit(1);
}

// Validate required columns
const required = ["episode", "question", "option_a", "option_b", "option_c", "option_d", "correct"];
// "title" is optional — falls back to "חִידוֹן עַל הַפֶּרֶק" if not provided
const headers = Object.keys(rows[0]);
const missing = required.filter((c) => !headers.includes(c));
if (missing.length) {
  console.error(`Missing columns: ${missing.join(", ")}`);
  console.error(`Found columns: ${headers.join(", ")}`);
  process.exit(1);
}

// Group rows by episode, preserving order of first appearance
const episodeOrder = [];
const episodeRows = new Map();
for (const row of rows) {
  const ep = row.episode.trim();
  if (!ep) continue;
  if (!episodeRows.has(ep)) {
    episodeRows.set(ep, []);
    episodeOrder.push(ep);
  }
  episodeRows.get(ep).push(row);
}

// Build new quizzes from CSV
const newQuizzes = new Map();
for (const ep of episodeOrder) {
  const epRows = episodeRows.get(ep);
  const episodeTitle = epRows[0].title?.trim() || "";
  newQuizzes.set(ep, rowsToQuiz(ep, epRows, episodeTitle));
}

// Merge with existing quizzes (new replaces old for same ID)
const existing = extractExistingQuizzes();
const merged = new Map();
for (const q of existing) merged.set(q.id, q);
for (const [id, q] of newQuizzes) merged.set(id, q);

// Sort by episode ID: s1e1, s1e2, ..., s2e1, ...
const sorted = [...merged.values()].sort((a, b) => {
  const pa = a.id.match(/^s(\d+)e(\d+)$/i);
  const pb = b.id.match(/^s(\d+)e(\d+)$/i);
  if (pa && pb) {
    const diff = Number(pa[1]) - Number(pb[1]);
    return diff !== 0 ? diff : Number(pa[2]) - Number(pb[2]);
  }
  return a.id.localeCompare(b.id);
});

writeFileSync(QUIZZES_PATH, serializeQuizzes(sorted), "utf-8");

console.log(`✅ Done! Imported ${newQuizzes.size} quiz(zes) from CSV.`);
for (const [id, quiz] of newQuizzes) {
  console.log(`   ${id} — ${quiz.questions.length} questions`);
}
console.log(`📄 quizzes.ts now contains ${sorted.length} total quiz(zes).`);
