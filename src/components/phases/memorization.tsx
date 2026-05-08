"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [passRunning, setPassRunning] = useState<1 | 2>(1);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Run a pass of 48 words, then call onPassDone
  const runPass = (
    words: WordColorPair[],
    globalOffset: number,
    onPassDone: () => void
  ) => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const schedule = (ms: number, fn: () => void) => {
      timeoutId = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const showWord = (index: number) => {
      if (cancelled) return;

      if (index >= words.length) {
        onPassDone();
        return;
      }

      setDisplay({
        item: words[index],
        phase: "word",
        globalIndex: globalOffset + index,
      });
      schedule(WORD_DISPLAY_MS, () => {
        setDisplay({
          item: null,
          phase: "isi",
          globalIndex: globalOffset + index,
        });
        schedule(ISI_MS, () => showWord(index + 1));
      });
    };

    showWord(0);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  };

  // Pass 1
  useEffect(() => {
    if (passRunning !== 1) return;
    return runPass(pass1Order, 0, () => {
      setDisplay({ item: null, phase: "inter-pass", globalIndex: 48 });
    });
  }, [pass1Order, passRunning]);

  // Pass 2
  useEffect(() => {
    if (passRunning !== 2) return;
    return runPass(pass2Order, 48, () => {
      onCompleteRef.current();
    });
  }, [pass2Order, passRunning]);

  const handleContinuePass2 = () => {
    setPassRunning(2);
  };

  if (display.phase === "inter-pass") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Deuxième passage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Vous allez maintenant revoir les mêmes mots, dans un ordre
              différent. Prenez quelques secondes pour vous préparer, puis
              cliquez sur Continuer lorsque vous êtes prêt(e).
            </p>
            <Button
              onClick={handleContinuePass2}
              className="w-full"
              size="lg"
            >
              Continuer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (display.phase === "done") return null;

  const totalItems = 96;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative">
      {display.phase === "word" && display.item ? (
        <>
          <p className="text-2xl font-medium text-[#666] uppercase tracking-wide mb-6 select-none">
            {display.item.category}
          </p>
          <p
            className="text-6xl font-bold select-none"
            style={{ color: COLOR_HEX[display.item.color as ExperimentColor] }}
          >
            {display.item.word}
          </p>
        </>
      ) : (
        <div className="h-32" />
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
