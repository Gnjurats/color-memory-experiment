"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import type { WordColorPair } from "@/db/schema";
import { COLOR_HEX, type ExperimentColor } from "@/lib/stimuli";

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function reshuffleWithinBlocks(data: WordColorPair[]): WordColorPair[] {
  // Group by blockIndex
  const blocks: Map<number, WordColorPair[]> = new Map();
  for (const item of data) {
    const existing = blocks.get(item.blockIndex) || [];
    existing.push(item);
    blocks.set(item.blockIndex, existing);
  }

  // Shuffle block order and within each block
  const blockIndices = shuffleArray(Array.from(blocks.keys()));
  const result: WordColorPair[] = [];
  for (const idx of blockIndices) {
    const block = blocks.get(idx)!;
    result.push(...shuffleArray(block));
  }
  return result;
}

const WORD_DISPLAY_MS = 4000;
const ISI_MS = 500;

export function MemorizationPhase({
  sequenceData,
  onComplete,
}: {
  sequenceData: WordColorPair[];
  onComplete: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWord, setShowWord] = useState(true);
  const [pass, setPass] = useState(1);
  const [showPassMessage, setShowPassMessage] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Build presentation orders for both passes
  const [pass1Order] = useState(() => [...sequenceData]);
  const [pass2Order] = useState(() => reshuffleWithinBlocks(sequenceData));

  const currentOrder = pass === 1 ? pass1Order : pass2Order;
  const totalItems = 96; // 48 × 2
  const globalIndex = pass === 1 ? currentIndex : 48 + currentIndex;

  const advanceWord = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);

    // Show ISI (blank)
    setShowWord(false);

    const isiStart = performance.now();
    const waitISI = (now: number) => {
      if (now - isiStart >= ISI_MS) {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= 48) {
          if (pass === 1) {
            // Show "Deuxième passage..." message
            setShowPassMessage(true);
            setTimeout(() => {
              setShowPassMessage(false);
              setPass(2);
              setCurrentIndex(0);
              setShowWord(true);
            }, 1500);
            return;
          } else {
            onComplete();
            return;
          }
        }
        setCurrentIndex(nextIndex);
        setShowWord(true);
      } else {
        timerRef.current = requestAnimationFrame(waitISI);
      }
    };
    timerRef.current = requestAnimationFrame(waitISI);
  }, [currentIndex, pass, onComplete]);

  useEffect(() => {
    if (showPassMessage) return;
    if (!showWord) return;

    startTimeRef.current = performance.now();
    const waitDisplay = (now: number) => {
      if (now - startTimeRef.current >= WORD_DISPLAY_MS) {
        advanceWord();
      } else {
        timerRef.current = requestAnimationFrame(waitDisplay);
      }
    };
    timerRef.current = requestAnimationFrame(waitDisplay);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [currentIndex, pass, showWord, showPassMessage, advanceWord]);

  if (showPassMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-2xl text-gray-600 font-medium">
          Deuxième passage...
        </p>
      </div>
    );
  }

  const currentItem = currentOrder[currentIndex];
  if (!currentItem) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative">
      {showWord ? (
        <p
          className="text-5xl font-bold select-none"
          style={{ color: COLOR_HEX[currentItem.color as ExperimentColor] }}
        >
          {currentItem.word}
        </p>
      ) : (
        <div className="h-16" />
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 space-y-1">
        <Progress value={(globalIndex / totalItems) * 100} className="h-2" />
        <p className="text-xs text-gray-400 text-center">
          {globalIndex + 1} / {totalItems}
        </p>
      </div>
    </div>
  );
}
