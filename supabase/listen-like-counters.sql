-- Run this in Supabase SQL editor → https://supabase.com/dashboard/project/_/sql

-- 1. Add counters to voice_recordings
ALTER TABLE voice_recordings ADD COLUMN IF NOT EXISTS listen_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE voice_recordings ADD COLUMN IF NOT EXISTS like_count   INTEGER DEFAULT 0 NOT NULL;

-- 2. Atomic increment for listens (safe under concurrent requests)
CREATE OR REPLACE FUNCTION increment_recording_listen(rec_id UUID)
RETURNS void AS $$
  UPDATE voice_recordings
  SET listen_count = listen_count + 1
  WHERE id = rec_id AND approved = true;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 3. Atomic increment for likes
CREATE OR REPLACE FUNCTION increment_recording_like(rec_id UUID)
RETURNS void AS $$
  UPDATE voice_recordings
  SET like_count = like_count + 1
  WHERE id = rec_id AND approved = true;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 4. Atomic decrement for unlikes (floor at 0)
CREATE OR REPLACE FUNCTION decrement_recording_like(rec_id UUID)
RETURNS void AS $$
  UPDATE voice_recordings
  SET like_count = GREATEST(0, like_count - 1)
  WHERE id = rec_id AND approved = true;
$$ LANGUAGE SQL SECURITY DEFINER;
