"use server";

import { db } from "@/db";
import { participants, sequences, trials } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { checkWordCorrect } from "./stimuli";

export async function startExperiment(pseudo: string | null, userAgent: string) {
  // Pick a random sequence
  const allSequences = await db.select({ id: sequences.id }).from(sequences);
  if (allSequences.length === 0) {
    throw new Error("No sequences found. Run npm run seed first.");
  }
  const randomSeq = allSequences[Math.floor(Math.random() * allSequences.length)];

  const [participant] = await db
    .insert(participants)
    .values({
      pseudo: pseudo || null,
      sequenceId: randomSeq.id,
      userAgent,
    })
    .returning();

  // Fetch the full sequence
  const [sequence] = await db
    .select()
    .from(sequences)
    .where(eq(sequences.id, randomSeq.id));

  return {
    participantId: participant.id,
    sequenceData: sequence.sequenceData,
  };
}

export async function submitTrial(data: {
  participantId: string;
  word: string;
  category: string;
  originalColor: string;
  typedAnswer: string;
  selectedColor: string;
  confidence: number;
  testOrder: number;
}) {
  const wordCorrect = checkWordCorrect(data.typedAnswer, data.word);
  const colorCorrect = data.selectedColor === data.originalColor;

  await db.insert(trials).values({
    participantId: data.participantId,
    word: data.word,
    category: data.category,
    originalColor: data.originalColor,
    typedAnswer: data.typedAnswer,
    wordCorrect,
    selectedColor: data.selectedColor,
    colorCorrect,
    confidence: data.confidence,
    testOrder: data.testOrder,
  });
}

export async function completeExperiment(participantId: string) {
  await db
    .update(participants)
    .set({ completedAt: new Date() })
    .where(eq(participants.id, participantId));
}

// Admin actions
export async function getParticipants() {
  const result = await db
    .select({
      id: participants.id,
      pseudo: participants.pseudo,
      startedAt: participants.startedAt,
      completedAt: participants.completedAt,
      trialCount: count(trials.id),
    })
    .from(participants)
    .leftJoin(trials, eq(participants.id, trials.participantId))
    .groupBy(participants.id)
    .orderBy(participants.startedAt);

  return result;
}

export async function getParticipantTrials(participantId: string) {
  const result = await db
    .select()
    .from(trials)
    .where(eq(trials.participantId, participantId))
    .orderBy(trials.testOrder);

  return result;
}

export async function toggleWordCorrect(trialId: string, value: boolean) {
  await db
    .update(trials)
    .set({ wordCorrect: value })
    .where(eq(trials.id, trialId));
}

export async function getAllTrials() {
  const result = await db
    .select({
      trialId: trials.id,
      participantId: trials.participantId,
      pseudo: participants.pseudo,
      word: trials.word,
      category: trials.category,
      originalColor: trials.originalColor,
      typedAnswer: trials.typedAnswer,
      wordCorrect: trials.wordCorrect,
      selectedColor: trials.selectedColor,
      colorCorrect: trials.colorCorrect,
      confidence: trials.confidence,
      testOrder: trials.testOrder,
    })
    .from(trials)
    .innerJoin(participants, eq(trials.participantId, participants.id))
    .orderBy(participants.startedAt, trials.testOrder);

  return result;
}

export async function getAggregateStats() {
  // Get all trials for aggregate analysis
  const allTrials = await db.select().from(trials);

  const stats: Record<
    string,
    {
      color: string;
      totalTrials: number;
      colorCorrect: number;
      wordCorrect: number;
      avgConfidenceCorrect: number;
      avgConfidenceIncorrect: number;
      confidenceCorrectSum: number;
      confidenceCorrectCount: number;
      confidenceIncorrectSum: number;
      confidenceIncorrectCount: number;
    }
  > = {};

  for (const color of ["red", "yellow", "blue", "green"]) {
    stats[color] = {
      color,
      totalTrials: 0,
      colorCorrect: 0,
      wordCorrect: 0,
      avgConfidenceCorrect: 0,
      avgConfidenceIncorrect: 0,
      confidenceCorrectSum: 0,
      confidenceCorrectCount: 0,
      confidenceIncorrectSum: 0,
      confidenceIncorrectCount: 0,
    };
  }

  for (const trial of allTrials) {
    const s = stats[trial.originalColor];
    if (!s) continue;
    s.totalTrials++;
    if (trial.colorCorrect) {
      s.colorCorrect++;
      s.confidenceCorrectSum += trial.confidence;
      s.confidenceCorrectCount++;
    } else {
      s.confidenceIncorrectSum += trial.confidence;
      s.confidenceIncorrectCount++;
    }
    if (trial.wordCorrect) s.wordCorrect++;
  }

  return Object.values(stats).map((s) => ({
    color: s.color,
    totalTrials: s.totalTrials,
    colorAccuracy: s.totalTrials > 0 ? s.colorCorrect / s.totalTrials : 0,
    wordAccuracy: s.totalTrials > 0 ? s.wordCorrect / s.totalTrials : 0,
    avgConfidenceCorrect:
      s.confidenceCorrectCount > 0
        ? s.confidenceCorrectSum / s.confidenceCorrectCount
        : 0,
    avgConfidenceIncorrect:
      s.confidenceIncorrectCount > 0
        ? s.confidenceIncorrectSum / s.confidenceIncorrectCount
        : 0,
  }));
}
