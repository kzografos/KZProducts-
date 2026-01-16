-- Migration: Add Settings Fields to Profiles Table
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/efmqyshnfjfdjtwvcjwf/sql)

-- Add new columns to profiles table for Settings page
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_id TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_postal_code TEXT,
ADD COLUMN IF NOT EXISTS address_country TEXT DEFAULT 'Greece';

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.phone IS 'User phone number for order communication';
COMMENT ON COLUMN public.profiles.avatar_id IS 'Selected avatar from predefined list (default, gamer-1, gamer-2, tech-1, tech-2, robot-1, robot-2, abstract-1, abstract-2)';
COMMENT ON COLUMN public.profiles.address_street IS 'Shipping street address';
COMMENT ON COLUMN public.profiles.address_city IS 'Shipping city';
COMMENT ON COLUMN public.profiles.address_postal_code IS 'Shipping postal code';
COMMENT ON COLUMN public.profiles.address_country IS 'Shipping country (Greece or Cyprus)';
