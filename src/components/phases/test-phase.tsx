"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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

type TestStep = "letter-display" | "word-entry" | "color-selection" | "confidence";

const LETTER_DISPLAY_MS = 4500;

export function TestPhase({
  sequenceData,
  participantId,
  onComplete,
}: {
  sequenceData: WordColorPair[];
  participantId: string;
  onComplete: () => void;
}) {
  const testOrder = useMemo(() => {
    const categoryOrder = shuffleArray([...CATEGORIES]);
    const items: WordColorPair[] = [];
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
  const [step, setStep] = useState<TestStep>("letter-display");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [capturedAnswer, setCapturedAnswer] = useState("");
  const [selectedColor, setSelectedColor] = useState<ExperimentColor | null>(null);
  const [timeLeft, setTimeLeft] = useState(LETTER_DISPLAY_MS);
  const [colorButtonOrder, setColorButtonOrder] = useState<ExperimentColor[]>(() =>
    shuffleArray([...COLORS])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const currentItem = testOrder[currentIndex];

  // Timer for letter display (sub-phase A1)
  useEffect(() => {
    if (step !== "letter-display") return;

    let cancelled = false;
    const start = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const elapsed = now - start;
      const remaining = Math.max(0, LETTER_DISPLAY_MS - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setStep("word-entry");
        return;
      }
      requestAnimationFrame(tick);
    };
    const frameId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [step, currentIndex]);

  // Autofocus input when entering word-entry step
  useEffect(() => {
    if (step === "word-entry") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [step]);

  const handleWordSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setCapturedAnswer(typedAnswer);
    setStep("color-selection");
    setColorButtonOrder(shuffleArray([...COLORS]));
  };

  const handleColorSelect = (color: ExperimentColor) => {
    setSelectedColor(color);
    setStep("confidence");
  };

  const handleConfidence = async (confidence: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
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

      if (currentIndex + 1 >= testOrder.length) {
        onComplete();
        return;
      }

      setCurrentIndex((i) => i + 1);
      setStep("letter-display");
      setTypedAnswer("");
      setCapturedAnswer("");
      setSelectedColor(null);
      setTimeLeft(LETTER_DISPLAY_MS);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentItem) return null;

  const firstLetter = currentItem.word.charAt(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      {/* Progress */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 space-y-1">
        <Progress value={(currentIndex / 48) * 100} className="h-2" />
        <p className="text-xs text-gray-400 text-center">
          {currentIndex + 1} / 48
        </p>
      </div>

      {step === "letter-display" && (
        <div className="flex flex-col items-center space-y-6">
          <p className="text-sm text-gray-500 mb-2 font-medium">
            Catégorie : {currentItem.category}
          </p>
          <p className="text-5xl font-bold text-[#888] select-none">
            {firstLetter}
          </p>
          <p className="text-xs text-gray-400">
            {(timeLeft / 1000).toFixed(1)}s
          </p>
        </div>
      )}

      {step === "word-entry" && (
        <form
          onSubmit={handleWordSubmit}
          className="flex flex-col items-center space-y-6 w-full max-w-md"
        >
          <p className="text-sm text-gray-500">Écrivez le mot</p>
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
          <Button type="submit" size="lg">
            Valider
          </Button>
        </form>
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
                disabled={isSubmitting}
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
