-- ============================================================================
-- Admin Notification System Migration
-- Created: 2026-02-05
-- Description: Creates tables and triggers for real-time admin notifications
-- ============================================================================

-- ============================================================================
-- 1. ADMIN_NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT admin_notifications_type_check CHECK (
    type IN ('new_order', 'payment_failure', 'low_stock', 'out_of_stock', 'security_alert')
  ),
  CONSTRAINT admin_notifications_priority_check CHECK (
    priority IN ('critical', 'high', 'medium', 'low')
  )
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_unread 
  ON public.admin_notifications(admin_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type 
  ON public.admin_notifications(type);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at 
  ON public.admin_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins can view their own notifications
CREATE POLICY "Admins can view own notifications" 
  ON public.admin_notifications FOR SELECT
  USING (
    admin_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Service role can insert (used by server-side triggers and APIs)
CREATE POLICY "Service role can insert notifications" 
  ON public.admin_notifications FOR INSERT
  WITH CHECK (true);

-- Admins can update their own notifications (mark as read)
CREATE POLICY "Admins can update own notifications" 
  ON public.admin_notifications FOR UPDATE
  USING (
    admin_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can delete their own notifications
CREATE POLICY "Admins can delete own notifications" 
  ON public.admin_notifications FOR DELETE
  USING (
    admin_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Grant permissions
GRANT ALL ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;


-- ============================================================================
-- 2. LOGIN_ATTEMPTS TABLE (for security alerts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_email TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient failed attempt lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time 
  ON public.login_attempts(ip_address, attempted_at DESC);

-- Enable RLS (service role only)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can manage login attempts
CREATE POLICY "Service role manages login attempts" 
  ON public.login_attempts FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.login_attempts TO service_role;


-- ============================================================================
-- 3. STOCK NOTIFICATION TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_stock_changes()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_priority TEXT;
BEGIN
  -- Only process if stock_quantity actually changed
  IF OLD.stock_quantity IS NOT DISTINCT FROM NEW.stock_quantity THEN
    RETURN NEW;
  END IF;

  -- Check for low stock alert (crossed threshold from >=5 to <5, but still >0)
  IF OLD.stock_quantity >= 5 AND NEW.stock_quantity < 5 AND NEW.stock_quantity > 0 THEN
    notification_type := 'low_stock';
    notification_title := 'Low Stock Warning';
    notification_message := 'Low Stock: ' || NEW.name || ' (only ' || NEW.stock_quantity || ' units left)';
    notification_priority := 'high';
  
  -- Check for out of stock (crossed threshold from >0 to 0)
  ELSIF OLD.stock_quantity > 0 AND NEW.stock_quantity = 0 THEN
    notification_type := 'out_of_stock';
    notification_title := 'Product Out of Stock';
    notification_message := 'Out of Stock: ' || NEW.name || ' - No units available';
    notification_priority := 'high';
  
  ELSE
    -- No notification needed for other stock changes
    RETURN NEW;
  END IF;

  -- Insert notification for each admin
  FOR admin_record IN 
    SELECT id FROM public.profiles WHERE is_admin = true
  LOOP
    INSERT INTO public.admin_notifications (
      admin_id,
      type,
      title,
      message,
      link,
      priority,
      related_id,
      metadata
    ) VALUES (
      admin_record.id,
      notification_type,
      notification_title,
      notification_message,
      '/admin/products/' || NEW.id,
      notification_priority,
      NEW.id,
      jsonb_build_object(
        'productName', NEW.name,
        'productId', NEW.id,
        'oldStock', OLD.stock_quantity,
        'newStock', NEW.stock_quantity
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS stock_notification_trigger ON public.products;

CREATE TRIGGER stock_notification_trigger
  AFTER UPDATE ON public.products
  FOR EACH ROW
  WHEN (OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity)
  EXECUTE FUNCTION public.notify_stock_changes();


-- ============================================================================
-- 4. ENABLE REALTIME FOR NOTIFICATIONS
-- ============================================================================

-- Enable realtime for the admin_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;


-- ============================================================================
-- ROLLBACK SCRIPT (for reference)
-- ============================================================================
-- To rollback this migration, run:
--
-- DROP TRIGGER IF EXISTS stock_notification_trigger ON public.products;
-- DROP FUNCTION IF EXISTS public.notify_stock_changes();
-- DROP TABLE IF EXISTS public.login_attempts;
-- DROP TABLE IF EXISTS public.admin_notifications;
-- ALTER PUBLICATION supabase_realtime DROP TABLE public.admin_notifications;
