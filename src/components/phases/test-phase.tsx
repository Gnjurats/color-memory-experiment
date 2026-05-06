"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { submitTrial } from "@/lib/actions";
import type { WordColorPair } from "@/db/schema";
import {
  CATEGORIES,
  COLOR_LABELS,
  COLORS,
  type ExperimentColor,
} from "@/lib/stimuli";

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type TestStep = "word-completion" | "color-selection" | "confidence";

const TYPING_TIME_MS = 4500;

export function TestPhase({
  sequenceData,
  participantId,
  onComplete,
}: {
  sequenceData: WordColorPair[];
  participantId: string;
  onComplete: () => void;
}) {
  // Build test order: blocked by category, random category order, random word order within category
  const testOrder = useMemo(() => {
    const categoryOrder = shuffleArray([...CATEGORIES]);
    const items: WordColorPair[] = [];

    // Deduplicate: sequenceData has 48 items, each word appears once
    const uniqueWords = new Map<string, WordColorPair>();
    for (const item of sequenceData) {
      uniqueWords.set(item.word, item);
    }

    for (const category of categoryOrder) {
      const catWords = shuffleArray(
        Array.from(uniqueWords.values()).filter((w) => w.category === category)
      );
      items.push(...catWords);
    }
    return items;
  }, [sequenceData]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<TestStep>("word-completion");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [capturedAnswer, setCapturedAnswer] = useState("");
  const [selectedColor, setSelectedColor] = useState<ExperimentColor | null>(null);
  const [timeLeft, setTimeLeft] = useState(TYPING_TIME_MS);
  const [colorButtonOrder, setColorButtonOrder] = useState<ExperimentColor[]>(() =>
    shuffleArray([...COLORS])
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const typedAnswerRef = useRef("");
  const timerStartRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const capturedRef = useRef(false);

  const currentItem = testOrder[currentIndex];

  // Sync ref with state for the typing input
  useEffect(() => {
    typedAnswerRef.current = typedAnswer;
  }, [typedAnswer]);

  // Timer for word completion
  useEffect(() => {
    if (step !== "word-completion") return;

    capturedRef.current = false;
    timerStartRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - timerStartRef.current;
      const remaining = Math.max(0, TYPING_TIME_MS - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0 && !capturedRef.current) {
        capturedRef.current = true;
        // Capture whatever is in the input at this moment
        const answer = typedAnswerRef.current;
        setCapturedAnswer(answer);
        setStep("color-selection");
        setColorButtonOrder(shuffleArray([...COLORS]));
        return;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 50);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [step, currentIndex]);

  const handleColorSelect = (color: ExperimentColor) => {
    setSelectedColor(color);
    setStep("confidence");
  };

  const handleConfidence = async (confidence: number) => {
    // Submit trial
    await submitTrial({
      participantId,
      word: currentItem.word,
      category: currentItem.category,
      originalColor: currentItem.color,
      typedAnswer: capturedAnswer,
      selectedColor: selectedColor!,
      confidence,
      testOrder: currentIndex,
    });

    // Move to next word or complete
    if (currentIndex + 1 >= testOrder.length) {
      onComplete();
      return;
    }

    setCurrentIndex((i) => i + 1);
    setStep("word-completion");
    setTypedAnswer("");
    setCapturedAnswer("");
    setSelectedColor(null);
    setTimeLeft(TYPING_TIME_MS);
  };

  if (!currentItem) return null;

  const firstLetter = currentItem.word.charAt(0);
  const underscores = "_".repeat(Math.max(1, currentItem.word.length - 1));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      {/* Progress */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 space-y-1">
        <Progress value={(currentIndex / 48) * 100} className="h-2" />
        <p className="text-xs text-gray-400 text-center">
          {currentIndex + 1} / 48
        </p>
      </div>

      {/* Category label */}
      <p className="text-sm text-gray-500 mb-2 font-medium">
        Catégorie : {currentItem.category}
      </p>

      {step === "word-completion" && (
        <div className="flex flex-col items-center space-y-6 w-full max-w-md">
          <p className="text-5xl font-bold text-gray-400 tracking-wider select-none">
            {firstLetter}
            <span className="text-gray-300">{underscores}</span>
          </p>

          <Input
            ref={inputRef}
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            placeholder="Tapez le mot..."
            className="text-center text-lg"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />

          <div className="w-32">
            <Progress
              value={(timeLeft / TYPING_TIME_MS) * 100}
              className="h-2"
            />
            <p className="text-xs text-gray-400 text-center mt-1">
              {(timeLeft / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
      )}

      {step === "color-selection" && (
        <div className="flex flex-col items-center space-y-6">
          <p className="text-4xl font-bold text-gray-400">
            {currentItem.word}
          </p>
          <p className="text-sm text-gray-500">
            Quelle était la couleur de ce mot ?
          </p>
          <div className="grid grid-cols-2 gap-4">
            {colorButtonOrder.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className="w-28 h-14 rounded-xl border-2 border-gray-200 bg-[#E5E5E5] text-[#333] font-bold text-base transition-all hover:scale-105 hover:shadow-lg active:scale-95 flex items-center justify-center"
              >
                {COLOR_LABELS[color]}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "confidence" && (
        <div className="flex flex-col items-center space-y-6">
          <p className="text-4xl font-bold text-gray-400">
            {currentItem.word}
          </p>
          <p className="text-sm text-gray-500">
            À quel point êtes-vous sûr(e) de votre choix de couleur ?
          </p>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((level) => (
              <Button
                key={level}
                variant="outline"
                className="w-16 h-16 text-xl font-bold"
                onClick={() => handleConfidence(level)}
              >
                {level}
              </Button>
            ))}
          </div>
          <div className="flex justify-between w-72 text-xs text-gray-400">
            <span>Extrêmement incertain</span>
            <span>Extrêmement certain</span>
          </div>
        </div>
      )}
    </div>
  );
}
