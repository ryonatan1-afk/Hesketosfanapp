/**
 * Generates MP3 audio files for all quiz questions using ElevenLabs.
 * Run once (or when questions change):
 *   npx tsx scripts/generate-quiz-audio.ts
 *
 * Requires ELEVENLABS_API_KEY in .env.local
 */

import fs from "fs";
import path from "path";
import { quizzes } from "../src/data/quizzes";

// Load .env.local manually so the script works without dotenv CLI
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
}

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "ni2h1CmdfOaJXvnn8fEJ";
const MODEL = "eleven_multilingual_v2";
const OUTPUT_DIR = path.join(process.cwd(), "public", "quiz-audio");

if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY in environment");
  process.exit(1);
}

async function generateAudio(text: string, outputPath: string): Promise<void> {
  if (fs.existsSync(outputPath)) {
    console.log(`  skip (exists): ${path.basename(outputPath)}`);
    return;
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${body}`);
  }

  const buffer = await res.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`  generated: ${path.basename(outputPath)}`);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const filterById = process.argv[2];
  const targets = filterById ? quizzes.filter(q => q.id === filterById) : quizzes;

  if (filterById && targets.length === 0) {
    console.error(`No quiz found with id "${filterById}"`);
    console.error(`Available: ${quizzes.map(q => q.id).join(", ")}`);
    process.exit(1);
  }

  for (const quiz of targets) {
    console.log(`\nQuiz: ${quiz.id} — ${quiz.title}`);
    const quizDir = path.join(OUTPUT_DIR, quiz.id);
    fs.mkdirSync(quizDir, { recursive: true });

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      // Combine question + options into one clip, with a brief pause between
      const text = `${q.question}... ${q.options.join("... ")}`;
      const outputPath = path.join(quizDir, `q${i}.mp3`);
      await generateAudio(text, outputPath);
      // Small delay to stay within rate limits
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  console.log("\nDone! All audio files saved to public/quiz-audio/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
