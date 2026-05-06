"use client";

import { useState, useEffect, useRef } from "react";
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
  const blocks: Map<number, WordColorPair[]> = new Map();
  for (const item of data) {
    const existing = blocks.get(item.blockIndex) || [];
    existing.push(item);
    blocks.set(item.blockIndex, existing);
  }
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

type DisplayState = {
  item: WordColorPair | null;
  phase: "word" | "isi" | "inter-pass" | "done";
  globalIndex: number;
};

export function MemorizationPhase({
  sequenceData,
  onComplete,
}: {
  sequenceData: WordColorPair[];
  onComplete: () => void;
}) {
  const [pass1Order] = useState(() => [...sequenceData]);
  const [pass2Order] = useState(() => reshuffleWithinBlocks(sequenceData));
  const [display, setDisplay] = useState<DisplayState>({
    item: null,
    phase: "word",
    globalIndex: 0,
  });
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const fullSequence = [...pass1Order, ...pass2Order];
    let shownInterPass = false;

    const schedule = (ms: number, fn: () => void) => {
      timeoutId = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const showWord = (index: number) => {
      if (cancelled) return;

      // Inter-pass overlay: show once when we reach index 48
      if (index === 48 && !shownInterPass) {
        shownInterPass = true;
        setDisplay({ item: null, phase: "inter-pass", globalIndex: 48 });
        schedule(1500, () => showWord(48));
        return;
      }

      // All 96 done
      if (index >= 96) {
        onCompleteRef.current();
        return;
      }

      // Display the word
      setDisplay({ item: fullSequence[index], phase: "word", globalIndex: index });
      schedule(WORD_DISPLAY_MS, () => {
        // ISI blank
        setDisplay({ item: null, phase: "isi", globalIndex: index });
        schedule(ISI_MS, () => showWord(index + 1));
      });
    };

    showWord(0);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pass1Order, pass2Order]);

  if (display.phase === "inter-pass") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-2xl text-gray-600 font-medium">
          Deuxième passage...
        </p>
      </div>
    );
  }

  if (display.phase === "done") return null;

  const totalItems = 96;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative">
      {display.phase === "word" && display.item ? (
        <p
          className="text-5xl font-bold select-none"
          style={{ color: COLOR_HEX[display.item.color as ExperimentColor] }}
        >
          {display.item.word}
        </p>
      ) : (
        <div className="h-16" />
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 space-y-1">
        <Progress
          value={((display.globalIndex + 1) / totalItems) * 100}
          className="h-2"
        />
        <p className="text-xs text-gray-400 text-center">
          {display.globalIndex + 1} / {totalItems}
        </p>
      </div>
    </div>
  );
}
