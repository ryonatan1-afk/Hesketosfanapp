"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { quizzes } from "@/data/quizzes";
import { trackEvent } from "@/lib/analytics";

const OPTION_COLORS = [
  "bg-blue",
  "bg-coral",
  "bg-lavender",
  "bg-ink",
] as const;

export default function QuizPlayer() {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const quiz = quizzes.find((q) => q.id === selectedQuizId) ?? null;

  function handleSelectQuiz(id: string) {
    const q = quizzes.find((q) => q.id === id);
    trackEvent("quiz_episode_selected", { episode_id: id, episode_label: q?.episodeLabel });
    setSelectedQuizId(id);
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  function handleBack() {
    trackEvent("quiz_back_to_episodes", { episode_id: selectedQuizId });
    setSelectedQuizId(null);
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  // Episode selector screen
  if (!quiz) {
    return (
      <div className="min-h-screen bg-blue flex flex-col p-6 pb-24 relative overflow-hidden">
        <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />
        <h1 className="text-white text-4xl font-black text-center mb-8 mt-4 drop-shadow">
          בְּחַר פֶּרֶק
        </h1>
        <div className="flex flex-col gap-4">
          {quizzes.map((q) => (
            <motion.button
              key={q.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelectQuiz(q.id)}
              className="bg-white rounded-3xl px-6 py-5 text-right shadow-md"
            >
              <p className="text-blue text-sm font-bold opacity-70">{q.episodeLabel}</p>
              <p className="text-ink text-xl font-black mt-1">{q.title}</p>
            </motion.button>
          ))}
        </div>
        <p className="text-white/60 text-sm font-bold text-center mt-6">
          עוֹד פְּרָקִים בַּדֶּרֶךְ ✨
        </p>
      </div>
    );
  }

  const question = quiz.questions[currentIndex];
  const total = quiz.questions.length;
  const isAnswered = selected !== null;

  function handleSelect(index: number) {
    if (isAnswered) return;
    const isCorrect = index === question.correctIndex;
    trackEvent("quiz_answer_submitted", {
      episode_id: selectedQuizId,
      question_index: currentIndex,
      is_correct: isCorrect,
    });
    setSelected(index);
    if (isCorrect) setScore((s) => s + 1);
  }

  function handleNext() {
    if (currentIndex + 1 >= total) {
      trackEvent("quiz_completed", { episode_id: selectedQuizId, score, total });
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    }
  }

  function handleRestart() {
    trackEvent("quiz_restarted", { episode_id: selectedQuizId });
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-yellow flex flex-col items-center justify-center gap-6 p-6 text-center relative overflow-hidden">
        <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="flex flex-col items-center gap-5"
        >
          <span className="text-8xl">⭐</span>
          <h1 className="text-white text-6xl font-black leading-tight drop-shadow">
            כָּל הַכָּבוֹד!
          </h1>
          <p className="text-white text-2xl font-bold">
            עָנִיתָ נָכוֹן עַל {score} מִתּוֹךְ {total} שְׁאֵלוֹת
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleRestart}
              className="mt-4 bg-white text-yellow text-2xl font-black px-10 py-5 rounded-3xl shadow-lg"
            >
              שַׂחַק שׁוּב
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleBack}
              className="mt-4 bg-ink text-white text-2xl font-black px-10 py-5 rounded-3xl shadow-lg"
            >
              פְּרָקִים
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow flex flex-col p-6 pb-28 relative overflow-hidden">
      <div className="absolute bottom-0 inset-x-0 h-3 bg-coral rounded-t-full" />

      {/* Progress bar */}
      <div className="w-full h-3 bg-white/30 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          animate={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Back + episode label + counter */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handleBack}
          className="text-white/80 text-sm font-bold"
        >
          ← פְּרָקִים
        </button>
        <span className="text-white/80 text-sm font-bold">{quiz.episodeLabel}</span>
        <span className="text-white/80 text-sm font-bold">
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col flex-1 gap-5"
        >
          <h2 className="text-white text-3xl font-black leading-snug text-center mb-2">
            {question.question}
          </h2>

          {/* Answer buttons */}
          <div className="flex flex-col gap-4">
            {question.options.map((option, i) => {
              let bgClass: string = OPTION_COLORS[i];
              let animateProps = {};

              if (isAnswered) {
                if (i === question.correctIndex) {
                  bgClass = "bg-green-400";
                  animateProps = { scale: [1, 1.08, 1] };
                } else if (i === selected) {
                  bgClass = "bg-red-400";
                  animateProps = { x: [0, -10, 10, -10, 10, 0] };
                }
              }

              const isDimmed =
                isAnswered &&
                i !== question.correctIndex &&
                i !== selected;

              return (
                <motion.button
                  key={i}
                  animate={animateProps}
                  transition={{ duration: 0.4 }}
                  onClick={() => handleSelect(i)}
                  className={`
                    ${bgClass}
                    ${isDimmed ? "opacity-40" : "opacity-100"}
                    w-full py-5 px-6 rounded-3xl
                    text-white text-xl font-black text-right
                    shadow-md active:scale-95 transition-opacity
                  `}
                >
                  {option}
                </motion.button>
              );
            })}
          </div>

          {/* Next button */}
          <AnimatePresence>
            {isAnswered && (
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleNext}
                className="mt-2 bg-ink text-white text-xl font-black py-5 rounded-3xl shadow-lg"
              >
                {currentIndex + 1 >= total ? "סִיּוּם ✓" : "הַבָּא ←"}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
