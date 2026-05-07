"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startExperiment, submitTrial, completeExperiment } from "@/lib/actions";
import type { WordColorPair } from "@/db/schema";
import { WelcomePhase } from "./phases/welcome";
import { InstructionsMemorization } from "./phases/instructions-memorization";
import { MemorizationPhase } from "./phases/memorization";
import { DistractionPhase } from "./phases/distraction";
import { TestInstructions } from "./phases/test-instructions";
import { TestTutorial } from "./phases/test-tutorial";
import { TestPhase } from "./phases/test-phase";
import { ThankYou } from "./phases/thank-you";

type Phase =
  | "welcome"
  | "instructions-memorization"
  | "memorization"
  | "distraction"
  | "test-instructions"
  | "test-tutorial"
  | "test"
  | "thank-you";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function ExperimentFlow() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [sequenceData, setSequenceData] = useState<WordColorPair[] | null>(null);

  // Warn on page leave during experiment
  useEffect(() => {
    if (phase !== "welcome" && phase !== "thank-you") {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
      };
      window.addEventListener("beforeunload", handler);
      return () => window.removeEventListener("beforeunload", handler);
    }
  }, [phase]);

  const handleStart = async (pseudo: string | null) => {
    const result = await startExperiment(pseudo, navigator.userAgent);
    setParticipantId(result.participantId);
    setSequenceData(result.sequenceData);
    setPhase("instructions-memorization");
  };

  const handleComplete = async () => {
    if (participantId) {
      await completeExperiment(participantId);
    }
    setPhase("thank-you");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="w-full"
        >
          {phase === "welcome" && <WelcomePhase onStart={handleStart} />}
          {phase === "instructions-memorization" && (
            <InstructionsMemorization onContinue={() => setPhase("memorization")} />
          )}
          {phase === "memorization" && sequenceData && (
            <MemorizationPhase
              sequenceData={sequenceData}
              onComplete={() => setPhase("distraction")}
            />
          )}
          {phase === "distraction" && (
            <DistractionPhase onComplete={() => setPhase("test-instructions")} />
          )}
          {phase === "test-instructions" && (
            <TestInstructions onContinue={() => setPhase("test-tutorial")} />
          )}
          {phase === "test-tutorial" && (
            <TestTutorial onComplete={() => setPhase("test")} />
          )}
          {phase === "test" && sequenceData && participantId && (
            <TestPhase
              sequenceData={sequenceData}
              participantId={participantId}
              onComplete={handleComplete}
            />
          )}
          {phase === "thank-you" && <ThankYou />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
