-- Update reviews_comment_check constraint to allow 10 character minimum (previously 50)
-- This migration updates the CHECK constraint on the reviews table

-- Drop the existing constraint
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_comment_check;

-- Add the new constraint with 10 character minimum
ALTER TABLE reviews ADD CONSTRAINT reviews_comment_check 
  CHECK (length(comment) >= 10 AND length(comment) <= 500);

-- Optional: Add title length constraint if not exists
-- ALTER TABLE reviews ADD CONSTRAINT reviews_title_check
--   CHECK (title IS NULL OR (length(title) >= 1 AND length(title) <= 100));
