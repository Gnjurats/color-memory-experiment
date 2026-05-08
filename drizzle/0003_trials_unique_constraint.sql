-- Deduplicate existing trials (keep earliest by created_at)
DELETE FROM trials t1
USING trials t2
WHERE t1.participant_id = t2.participant_id
  AND t1.test_order = t2.test_order
  AND t1.created_at > t2.created_at;--> statement-breakpoint

-- Add unique constraint to prevent future duplicates
ALTER TABLE trials
ADD CONSTRAINT trials_participant_testorder_unique
UNIQUE (participant_id, test_order);
