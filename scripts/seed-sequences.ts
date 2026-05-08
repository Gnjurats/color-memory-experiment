import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import {
  CATEGORIES,
  WORDS_BY_CATEGORY,
  COLORS,
  type ExperimentColor,
  type Category,
} from "../src/lib/stimuli";
import type { WordColorPair } from "../src/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateSequence(): WordColorPair[] {
  // Step 1: Assign colors — each color 12× total, each color 2× per category
  const wordColorPairs: { word: string; category: Category; color: ExperimentColor }[] = [];

  for (const category of CATEGORIES) {
    const words = fisherYatesShuffle(WORDS_BY_CATEGORY[category]);
    // 8 words, 4 colors, 2 each
    const colorAssignment = fisherYatesShuffle([
      ...COLORS,
      ...COLORS,
    ] as ExperimentColor[]);

    for (let i = 0; i < 8; i++) {
      wordColorPairs.push({
        word: words[i],
        category,
        color: colorAssignment[i],
      });
    }
  }

  // Validate: each color appears exactly 12 times total
  const colorCounts: Record<string, number> = {};
  for (const p of wordColorPairs) {
    colorCounts[p.color] = (colorCounts[p.color] || 0) + 1;
  }
  for (const color of COLORS) {
    console.assert(
      colorCounts[color] === 12,
      `Color ${color} appears ${colorCounts[color]} times, expected 12`
    );
  }

  // Validate: each color appears exactly 2 times per category
  for (const category of CATEGORIES) {
    const catPairs = wordColorPairs.filter((p) => p.category === category);
    const catColorCounts: Record<string, number> = {};
    for (const p of catPairs) {
      catColorCounts[p.color] = (catColorCounts[p.color] || 0) + 1;
    }
    for (const color of COLORS) {
      console.assert(
        catColorCounts[color] === 2,
        `Category ${category}, color ${color}: ${catColorCounts[color]} times, expected 2`
      );
    }
  }

  // Step 2: Build 8 blocks of 6 words (one per category per block)
  // Group words by category
  const wordsPerCategory: Record<string, typeof wordColorPairs> = {};
  for (const category of CATEGORIES) {
    wordsPerCategory[category] = fisherYatesShuffle(
      wordColorPairs.filter((p) => p.category === category)
    );
  }

  const blocks: WordColorPair[][] = [];
  for (let blockIdx = 0; blockIdx < 8; blockIdx++) {
    const block: WordColorPair[] = [];
    for (const category of CATEGORIES) {
      const item = wordsPerCategory[category][blockIdx];
      block.push({
        word: item.word,
        category: item.category,
        color: item.color,
        blockIndex: blockIdx,
        positionInBlock: 0, // will be set after shuffle
      });
    }
    // Randomize order within block
    const shuffledBlock = fisherYatesShuffle(block);
    shuffledBlock.forEach((item, idx) => {
      item.positionInBlock = idx;
    });
    blocks.push(shuffledBlock);
  }

  // Validate: each block has one word per category
  for (let i = 0; i < 8; i++) {
    const cats = new Set(blocks[i].map((w) => w.category));
    console.assert(
      cats.size === 6,
      `Block ${i} has ${cats.size} categories, expected 6`
    );
  }

  // Flatten
  return blocks.flat();
}

async function seed() {
  console.log("Clearing existing data...");
  await db.delete(schema.trials);
  await db.delete(schema.participants);
  await db.delete(schema.sequences);
  console.log("Generating 50 sequences...");

  const sequenceRows = [];
  for (let i = 0; i < 50; i++) {
    sequenceRows.push({
      sequenceData: generateSequence(),
    });
  }

  // Insert in batches
  for (let i = 0; i < sequenceRows.length; i += 10) {
    const batch = sequenceRows.slice(i, i + 10);
    await db.insert(schema.sequences).values(batch);
    console.log(`Inserted sequences ${i + 1}-${i + batch.length}`);
  }

  console.log("Done! 50 sequences seeded.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
