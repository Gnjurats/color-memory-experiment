ALTER TABLE "participants" DROP COLUMN IF EXISTS "age_range";--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "age" integer;
