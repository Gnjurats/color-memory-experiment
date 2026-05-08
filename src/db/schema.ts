import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  boolean,
  integer,
  unique,
} from "drizzle-orm/pg-core";

export type WordColorPair = {
  word: string;
  category: string;
  color: "red" | "yellow" | "blue" | "green";
  blockIndex: number;
  positionInBlock: number;
};

export const sequences = pgTable("sequences", {
  id: uuid("id").defaultRandom().primaryKey(),
  sequenceData: jsonb("sequence_data").$type<WordColorPair[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const participants = pgTable("participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  pseudo: text("pseudo"),
  sequenceId: uuid("sequence_id")
    .references(() => sequences.id)
    .notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  userAgent: text("user_agent"),
  age: integer("age"),
  gender: text("gender"),
});

export const trials = pgTable("trials", {
  id: uuid("id").defaultRandom().primaryKey(),
  participantId: uuid("participant_id")
    .references(() => participants.id)
    .notNull(),
  word: text("word").notNull(),
  category: text("category").notNull(),
  originalColor: text("original_color").notNull(),
  typedAnswer: text("typed_answer").notNull(),
  wordCorrect: boolean("word_correct").notNull(),
  selectedColor: text("selected_color").notNull(),
  colorCorrect: boolean("color_correct").notNull(),
  confidence: integer("confidence").notNull(),
  testOrder: integer("test_order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("trials_participant_testorder_unique").on(table.participantId, table.testOrder),
]);
