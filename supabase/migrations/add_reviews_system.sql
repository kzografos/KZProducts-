-- ============================================================================
-- PRODUCT REVIEWS SYSTEM MIGRATION
-- ============================================================================
-- Purpose: Add product review system with ratings, helpful votes, and admin responses
-- Features:
--   - Star ratings (1-5)
--   - Written reviews with optional title
--   - One review per user per product
--   - Helpful vote system
--   - Admin responses to reviews
--   - Verified purchase badge support
--
-- Run: https://supabase.com/dashboard/project/efmqyshnfjfdjtwvcjwf/sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title varchar(100),
  comment text NOT NULL CHECK (char_length(comment) >= 50 AND char_length(comment) <= 500),
  is_approved boolean DEFAULT true,
  is_flagged boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- One review per user per product
  UNIQUE(user_id, product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS reviews_is_approved_idx ON public.reviews (is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON public.reviews (created_at DESC);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews FOR SELECT
TO public
USING (
  is_approved = true
  OR
  user_id = (SELECT auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- Admin can update any review (for approval/flagging)
CREATE POLICY "Admins can update any review"
ON public.reviews FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Admins can delete any review
CREATE POLICY "Admins can delete any review"
ON public.reviews FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
);

-- ============================================================================
-- PART 2: REVIEW HELPFUL VOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- One vote per user per review
  UNIQUE(review_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS review_helpful_votes_review_id_idx ON public.review_helpful_votes (review_id);

-- Enable RLS
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for helpful votes
-- Anyone can view vote counts (via reviews)
CREATE POLICY "Anyone can view helpful votes"
ON public.review_helpful_votes FOR SELECT
TO public
USING (true);

-- Authenticated users can vote
CREATE POLICY "Authenticated users can vote helpful"
ON public.review_helpful_votes FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can remove their vote
CREATE POLICY "Users can remove own vote"
ON public.review_helpful_votes FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 3: REVIEW RESPONSES TABLE (Admin replies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.review_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE UNIQUE,
  admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response text NOT NULL CHECK (char_length(response) >= 10 AND char_length(response) <= 1000),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Index
CREATE INDEX IF NOT EXISTS review_responses_review_id_idx ON public.review_responses (review_id);

-- Enable RLS
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for responses
-- Anyone can view responses
CREATE POLICY "Anyone can view review responses"
ON public.review_responses FOR SELECT
TO public
USING (true);

-- Only admins can create responses
CREATE POLICY "Admins can create review responses"
ON public.review_responses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
  AND admin_id = (SELECT auth.uid())
);

-- Only admins can update responses
CREATE POLICY "Admins can update review responses"
ON public.review_responses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
);

-- Only admins can delete responses
CREATE POLICY "Admins can delete review responses"
ON public.review_responses FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
);

-- ============================================================================
-- PART 4: UTILITY FUNCTION FOR VERIFIED PURCHASE CHECK
-- ============================================================================

-- Function to check if a user has purchased a product
CREATE OR REPLACE FUNCTION public.has_purchased_product(p_user_id uuid, p_product_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.user_id = p_user_id
    AND oi.product_id = p_product_id
    AND o.status IN ('paid', 'shipped', 'delivered', 'completed')
  );
$$;

-- ============================================================================
-- PART 5: UTILITY FUNCTION FOR REVIEW STATS
-- ============================================================================

-- Function to get review stats for a product
CREATE OR REPLACE FUNCTION public.get_product_review_stats(p_product_id uuid)
RETURNS TABLE (
  average_rating numeric,
  total_reviews bigint,
  rating_5 bigint,
  rating_4 bigint,
  rating_3 bigint,
  rating_2 bigint,
  rating_1 bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE rating = 5) as rating_5,
    COUNT(*) FILTER (WHERE rating = 4) as rating_4,
    COUNT(*) FILTER (WHERE rating = 3) as rating_3,
    COUNT(*) FILTER (WHERE rating = 2) as rating_2,
    COUNT(*) FILTER (WHERE rating = 1) as rating_1
  FROM public.reviews
  WHERE product_id = p_product_id
  AND is_approved = true;
$$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================================
-- Check tables created:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'review%';
--
-- Check RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'review%';
--
-- Check policies:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'review%';
