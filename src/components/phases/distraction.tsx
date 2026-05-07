"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GENERAL_KNOWLEDGE_QUESTIONS,
  type MCQuestion,
} from "@/lib/distraction-questions";

const DURATION_MS = 4 * 60 * 1000; // 4 minutes

type QuestionType = "math" | "knowledge";

function generateMathQuestion(): {
  question: string;
  answer: number;
} {
  const a = Math.floor(Math.random() * 49) + 2;
  const b = Math.floor(Math.random() * 49) + 2;
  const ops = ["+", "-", "×"] as const;
  const op = ops[Math.floor(Math.random() * 3)];

  let answer: number;
  switch (op) {
    case "+":
      answer = a + b;
      break;
    case "-":
      answer = a - b;
      break;
    case "×":
      answer = a * b;
      break;
  }

  return { question: `${a} ${op} ${b} = ?`, answer };
}

export function DistractionPhase({ onComplete }: { onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<{
    type: QuestionType;
    question: string;
    mathAnswer?: number;
    mcQuestion?: MCQuestion;
  } | null>(null);
  const [mathInput, setMathInput] = useState("");
  const [started, setStarted] = useState(false);
  const usedKnowledgeRef = useRef<Set<number>>(new Set());
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);

  const generateQuestion = useCallback(() => {
    const isMath = Math.random() < 0.5;
    if (isMath) {
      const { question, answer } = generateMathQuestion();
      setCurrentQuestion({ type: "math", question, mathAnswer: answer });
    } else {
      // Pick unused knowledge question or fall back to math
      const available = GENERAL_KNOWLEDGE_QUESTIONS.filter(
        (_, i) => !usedKnowledgeRef.current.has(i)
      );
      if (available.length === 0) {
        const { question, answer } = generateMathQuestion();
        setCurrentQuestion({ type: "math", question, mathAnswer: answer });
        return;
      }
      const idx = Math.floor(Math.random() * available.length);
      const originalIdx = GENERAL_KNOWLEDGE_QUESTIONS.indexOf(available[idx]);
      usedKnowledgeRef.current.add(originalIdx);
      setCurrentQuestion({
        type: "knowledge",
        question: available[idx].question,
        mcQuestion: available[idx],
      });
    }
    setMathInput("");
  }, []);

  const handleStart = () => {
    setStarted(true);
    startTimeRef.current = performance.now();
    generateQuestion();
  };

  useEffect(() => {
    if (!started) return;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const remaining = Math.max(0, DURATION_MS - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        onComplete();
        return;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [started, onComplete]);

  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuestionsAnswered((c) => c + 1);
    generateQuestion();
  };

  const handleKnowledgeAnswer = () => {
    setQuestionsAnswered((c) => c + 1);
    generateQuestion();
  };

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              Questions diverses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Vous avez <strong>4 minutes</strong> pour répondre au maximum de
              questions. Faites de votre mieux.
            </p>
            <Button onClick={handleStart} className="w-full" size="lg">
              Commencer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Questions</CardTitle>
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{timeStr}</p>
              <p className="text-xs text-muted-foreground">
                Questions répondues : {questionsAnswered}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentQuestion?.type === "math" && (
            <form onSubmit={handleMathSubmit} className="space-y-4">
              <p className="text-xl font-medium text-center py-4">
                {currentQuestion.question}
              </p>
              <Input
                type="number"
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                placeholder="Votre réponse..."
                autoFocus
                className="text-center text-lg"
              />
              <Button type="submit" className="w-full" disabled={!mathInput}>
                Valider
              </Button>
            </form>
          )}

          {currentQuestion?.type === "knowledge" && currentQuestion.mcQuestion && (
            <div className="space-y-4">
              <p className="text-lg font-medium text-center py-4">
                {currentQuestion.mcQuestion.question}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {currentQuestion.mcQuestion.options.map((option, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full text-left justify-start h-auto py-3 px-4"
                    onClick={handleKnowledgeAnswer}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
