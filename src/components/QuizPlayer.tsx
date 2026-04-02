"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { quizzes, type Question } from "@/data/quizzes";
import { trackEvent } from "@/lib/analytics";
import { addCoins } from "@/lib/coins";

function useQuizAudio(quizId: string | null) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function play(questionIndex: number) {
    if (!quizId) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(`/quiz-audio/${quizId}/q${questionIndex}.mp3`);
    audio.onplay = () => setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audioRef.current = audio;
    audio.play().catch(() => setPlaying(false));
  }

  function stop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
  }

  return { play, stop, playing };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions(q: (typeof quizzes)[0]): Question[] {
  return q.pick ? shuffle(q.questions).slice(0, q.pick) : q.questions;
}

const OPTION_COLORS = [
  "bg-blue",
  "bg-coral",
  "bg-lavender",
  "bg-teal-400",
] as const;

const CARD_COLORS = [
  "bg-pink-400",
  "bg-blue",
  "bg-green-400",
  "bg-purple-400",
  "bg-yellow",
  "bg-coral",
  "bg-sky-400",
  "bg-lavender",
];

export default function QuizPlayer() {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [isPerfect, setIsPerfect] = useState(false);
  const [showCoinPop, setShowCoinPop] = useState(false);
  const { play, stop, playing } = useQuizAudio(selectedQuizId);

  const quiz = quizzes.find((q) => q.id === selectedQuizId) ?? null;

  const advancedRef = useRef(false);
  useEffect(() => { advancedRef.current = false; }, [currentIndex, selected]);

  function handleSelectQuiz(id: string) {
    const q = quizzes.find((q) => q.id === id);
    trackEvent("quiz_episode_selected", { episode_id: id, episode_label: q?.episodeLabel });
    setActiveQuestions(q ? pickQuestions(q) : []);
    setSelectedQuizId(id);
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setCoinsEarned(0);
    setIsPerfect(false);
  }

  function handleBack() {
    stop();
    trackEvent("quiz_back_to_episodes", { episode_id: selectedQuizId });
    setSelectedQuizId(null);
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setCoinsEarned(0);
    setIsPerfect(false);
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
          {quizzes.map((q, i) => {
            if (q.id === "audience") {
              return (
                <motion.button
                  key={q.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleSelectQuiz(q.id)}
                  className="bg-gradient-to-l from-pink-400 to-violet-500 rounded-3xl px-6 py-5 text-center shadow-md"
                >
                  <p className="text-3xl mb-1">💌</p>
                  <p className="text-white text-xl font-bold">{q.title}</p>
                </motion.button>
              );
            }
            return (
              <motion.button
                key={q.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleSelectQuiz(q.id)}
                className={`${CARD_COLORS[i % CARD_COLORS.length]} rounded-3xl px-6 py-5 text-right shadow-md`}
              >
                <p className="text-white/70 text-sm font-normal">{q.episodeLabel}</p>
                <p className="text-white text-xl font-bold mt-1">{q.title}</p>
              </motion.button>
            );
          })}
        </div>
        <p className="text-white/60 text-sm font-normal text-center mt-6">
          עוֹד פְּרָקִים בַּדֶּרֶךְ ✨
        </p>
      </div>
    );
  }

  const question = activeQuestions[currentIndex];
  const total = activeQuestions.length;
  if (!question) return null;
  const isAnswered = selected !== null;

  function handleNextSafe() {
    if (advancedRef.current) return;
    advancedRef.current = true;
    handleNext();
  }

  function handleSelect(index: number) {
    if (isAnswered) return;
    const isCorrect = index === question.correctIndex;
    trackEvent("quiz_answer_submitted", {
      episode_id: selectedQuizId,
      question_index: currentIndex,
      is_correct: isCorrect,
    });
    setSelected(index);
    if (isCorrect) {
      setScore((s) => s + 1);
      addCoins(1);
      setCoinsEarned((c) => c + 1);
      setShowCoinPop(true);
      setTimeout(() => setShowCoinPop(false), 700);
    }
  }

  function handleNext() {
    stop();
    if (currentIndex + 1 >= total) {
      const perfect = score === total;
      if (perfect) {
        addCoins(3);
        setCoinsEarned((c) => c + 3);
        setIsPerfect(true);
      }
      trackEvent("quiz_completed", { episode_id: selectedQuizId, score, total });
      trackEvent("quiz_coins_earned", { episode_id: selectedQuizId, coins_earned: coinsEarned + (perfect ? 3 : 0), is_perfect: perfect });
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    }
  }

  function handleRestart() {
    trackEvent("quiz_restarted", { episode_id: selectedQuizId });
    if (quiz) setActiveQuestions(pickQuestions(quiz));
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setCoinsEarned(0);
    setIsPerfect(false);
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
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }}
            className="flex flex-col items-center gap-1"
          >
            <p className="text-white text-3xl font-black">
              🪙 +{coinsEarned} מַטְבְּעוֹת!
            </p>
            {isPerfect && (
              <p className="text-white/80 text-lg font-bold">בּוֹנוּס שְׁלֵמוּת! +3 ✨</p>
            )}
          </motion.div>
          <div className="flex gap-4 flex-wrap justify-center">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleRestart}
              className="mt-4 bg-white text-yellow text-2xl font-bold px-10 py-5 rounded-3xl shadow-lg"
            >
              שַׂחֲקוּ שׁוּב
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleBack}
              className="mt-4 bg-ink text-white text-2xl font-bold px-10 py-5 rounded-3xl shadow-lg"
            >
              פְּרָקִים
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow flex flex-col p-6 pb-8 relative overflow-hidden">
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
          className="text-white/80 text-sm font-normal"
        >
          ← פְּרָקִים
        </button>
        <span className="text-white/80 text-sm font-normal">{quiz.episodeLabel}</span>
        <span className="text-white/80 text-sm font-normal">
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

          {/* Floating coin pop */}
          <div className="relative h-0">
            <AnimatePresence>
              {showCoinPop && (
                <motion.p
                  key="coinpop"
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{ y: -48, opacity: 0, scale: 1.3 }}
                  exit={{}}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-x-0 text-center text-white text-2xl font-black pointer-events-none"
                >
                  +1 🪙
                </motion.p>
              )}
            </AnimatePresence>
          </div>

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
                    text-white text-xl font-bold text-right
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
                onClick={handleNextSafe}
                className="relative overflow-hidden mt-2 bg-ink text-white text-xl font-bold py-5 rounded-3xl shadow-lg"
              >
                <motion.span
                  key={`timer-${currentIndex}`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  onAnimationComplete={handleNextSafe}
                  className="absolute inset-y-0 right-0 bg-white/20 pointer-events-none"
                />
                <span className="relative z-10">
                  {currentIndex + 1 >= total ? "סִיּוּם ✓" : "הַבָּא ←"}
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
