-- Add RFQ type and make target_business_id nullable for open RFQs
ALTER TABLE public.rfq_requests 
  ALTER COLUMN target_business_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS rfq_type text NOT NULL DEFAULT 'private' CHECK (rfq_type IN ('private', 'open', 'governmental')),
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Update existing RFQs to be private
UPDATE public.rfq_requests 
SET rfq_type = 'private', is_public = false 
WHERE rfq_type IS NULL OR is_public IS NULL;

-- Add RLS policy for viewing public RFQs
CREATE POLICY "Anyone can view public RFQs"
ON public.rfq_requests
FOR SELECT
USING (is_public = true);

-- Add notification preferences for RFQ alerts
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS notify_rfq_open boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_rfq_governmental boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_rfq_categories text[] DEFAULT '{}';

-- Create function to notify interested users about new open RFQs
CREATE OR REPLACE FUNCTION public.notify_on_open_rfq()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _interested_user record;
BEGIN
  IF NEW.is_public = true THEN
    -- Notify users interested in this category
    FOR _interested_user IN
      SELECT DISTINCT np.user_id
      FROM public.notification_preferences np
      LEFT JOIN public.user_interests ui ON ui.user_id = np.user_id
      WHERE np.user_id != NEW.requester_id
        AND (
          (NEW.rfq_type = 'open' AND np.notify_rfq_open = true)
          OR (NEW.rfq_type = 'governmental' AND np.notify_rfq_governmental = true)
        )
        AND (
          np.notify_rfq_categories = '{}' 
          OR NEW.product_category = ANY(np.notify_rfq_categories)
          OR NEW.product_category = ANY(ui.categories)
        )
    LOOP
      PERFORM public.create_notification(
        _interested_user.user_id,
        'new_rfq',
        'New ' || NEW.rfq_type || ' RFQ: ' || NEW.product_name,
        'طلب تسعير ' || NEW.rfq_type || ' جديد: ' || NEW.product_name,
        NEW.description,
        NEW.description,
        '/rfq-marketplace'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new open RFQs
DROP TRIGGER IF EXISTS notify_on_open_rfq_trigger ON public.rfq_requests;
CREATE TRIGGER notify_on_open_rfq_trigger
  AFTER INSERT ON public.rfq_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_open_rfq();