-- Run before deploying when DB_SYNCHRONIZE=false.
-- Legacy records intentionally retain NULL; readers fall back to createdAt.
-- This avoids guessing the timezone of existing timestamp-without-time-zone data.
ALTER TABLE daily_moods ADD COLUMN IF NOT EXISTS "recordedAt" timestamptz NULL;
