-- Wishlist Items Table
-- Allows users to save favorite products

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS wishlist_items_user_id_idx ON wishlist_items (user_id);
CREATE INDEX IF NOT EXISTS wishlist_items_product_id_idx ON wishlist_items (product_id);

-- RLS Policy: Users can SELECT their own wishlist items
CREATE POLICY "Users can view own wishlist" ON wishlist_items
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- RLS Policy: Users can INSERT into their own wishlist
CREATE POLICY "Users can add to own wishlist" ON wishlist_items
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- RLS Policy: Users can DELETE from their own wishlist
CREATE POLICY "Users can remove from own wishlist" ON wishlist_items
  FOR DELETE USING (user_id = (SELECT auth.uid()));
