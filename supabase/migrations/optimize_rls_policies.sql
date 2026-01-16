-- ============================================================================
-- RLS POLICY OPTIMIZATION MIGRATION
-- ============================================================================
-- Purpose: Optimize Row Level Security policies for scale
-- - Wrap auth.uid() in subqueries (InitPlan optimization)
-- - Consolidate multiple SELECT policies with OR logic
-- - Add missing indexes
-- 
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/efmqyshnfjfdjtwvcjwf/sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: ADD MISSING INDEXES
-- ============================================================================

-- Index for admin checks (used in many policies)
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON public.profiles (is_admin) WHERE is_admin = true;

-- Index for cart_items user lookups
CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON public.cart_items (user_id);

-- Index for addresses user lookups
CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON public.addresses (user_id);

-- ============================================================================
-- PART 2: ADDRESSES TABLE - Optimize auth.uid() calls
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can create own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can view own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;

CREATE POLICY "Users can view own addresses"
ON public.addresses FOR SELECT
TO public
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own addresses"
ON public.addresses FOR INSERT
TO public
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own addresses"
ON public.addresses FOR UPDATE
TO public
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own addresses"
ON public.addresses FOR DELETE
TO public
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 3: CART_ITEMS TABLE - Optimize auth.uid() calls
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can add to own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;

CREATE POLICY "Users can view own cart items"
ON public.cart_items FOR SELECT
TO public
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create cart items"
ON public.cart_items FOR INSERT
TO public
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own cart items"
ON public.cart_items FOR UPDATE
TO public
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own cart items"
ON public.cart_items FOR DELETE
TO public
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 4: CATEGORIES TABLE - Optimize admin subqueries
-- ============================================================================

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;

CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
);

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE
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

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
);

-- ============================================================================
-- PART 5: ORDER_ITEMS TABLE - Consolidate SELECT + Optimize
-- ============================================================================

DROP POLICY IF EXISTS "Users can create own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order_items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;

-- Consolidated SELECT: Users see own order items OR admins see all
CREATE POLICY "Users and admins can view order items"
ON public.order_items FOR SELECT
TO public
USING (
  -- User owns the parent order
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = (SELECT auth.uid())
  )
  OR
  -- User is admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
);

CREATE POLICY "Users can create order items"
ON public.order_items FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- PART 6: ORDERS TABLE - Consolidate SELECT + Optimize
-- ============================================================================

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Consolidated SELECT: Users see own orders OR admins see all
CREATE POLICY "Users and admins can view orders"
ON public.orders FOR SELECT
TO public
USING (
  user_id = (SELECT auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
);

CREATE POLICY "Users can create orders"
ON public.orders FOR INSERT
TO public
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
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

-- ============================================================================
-- PART 7: PRODUCTS TABLE - Optimize admin subqueries
-- ============================================================================

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;

-- Public can view active products, admins can view all
CREATE POLICY "Anyone can view active products or admins view all"
ON public.products FOR SELECT
TO public
USING (
  is_active = true
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
);

CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
);

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
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

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND is_admin = true
  )
);

-- ============================================================================
-- PART 8: PROFILES TABLE - Optimize auth.uid() calls
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile or admins view all"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles AS p
    WHERE p.id = (SELECT auth.uid())
    AND p.is_admin = true
  )
);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO public
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO public
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

COMMIT;

-- ============================================================================
-- VERIFICATION: Run after migration to confirm policies are applied
-- ============================================================================
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, cmd;
