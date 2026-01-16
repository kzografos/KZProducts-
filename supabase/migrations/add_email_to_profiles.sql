-- Migration: Add Email to Profiles and Sync with Auth
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN public.profiles.email IS 'User email synced from auth.users. Ensure RLS policies protect this PII.';

-- 2. Update the handle_new_user function to include email
-- We use CREATE OR REPLACE to update the existing function.
-- NOTE: This assumes your existing function inserts id, full_name, and avatar_url. 
-- If you have custom logic, please verify before running.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill email for existing users
-- This safely updates profiles that currently have no email, using data from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 4. Verification Check
-- Determine how many users still don't have an email (should be 0)
SELECT count(*) as profiles_missing_email
FROM public.profiles
WHERE email IS NULL;
