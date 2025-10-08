-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title_en text NOT NULL,
  title_ar text NOT NULL,
  content_en text NOT NULL,
  content_ar text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_on_message boolean DEFAULT true,
  email_on_verification boolean DEFAULT true,
  email_on_new_business boolean DEFAULT false,
  email_on_new_product boolean DEFAULT false,
  email_on_inquiry boolean DEFAULT true,
  email_on_favorite boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create user interests table for smart notifications
CREATE TABLE IF NOT EXISTS public.user_interests (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  categories text[] DEFAULT '{}',
  industries text[] DEFAULT '{}',
  business_types text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policies for notification preferences
CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user interests
CREATE POLICY "Users can view own interests"
  ON public.user_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own interests"
  ON public.user_interests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interests"
  ON public.user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _type text,
  _title_en text,
  _title_ar text,
  _content_en text,
  _content_ar text,
  _link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title_en, title_ar, content_en, content_ar, link)
  VALUES (_user_id, _type, _title_en, _title_ar, _content_en, _content_ar, _link)
  RETURNING id INTO _notification_id;
  
  RETURN _notification_id;
END;
$$;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notifications_read(_notification_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE id = ANY(_notification_ids)
    AND user_id = auth.uid();
END;
$$;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE user_id = auth.uid()
    AND is_read = false;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM public.notifications
  WHERE user_id = _user_id
    AND is_read = false;
$$;

-- Trigger to create notification on new message
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _receiver_id uuid;
  _sender_name text;
  _conversation record;
BEGIN
  SELECT * INTO _conversation
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  -- Determine receiver
  IF _conversation.participant_1_id = NEW.sender_id THEN
    _receiver_id := _conversation.participant_2_id;
  ELSE
    _receiver_id := _conversation.participant_1_id;
  END IF;
  
  -- Get sender name
  SELECT full_name INTO _sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;
  
  -- Create notification
  PERFORM public.create_notification(
    _receiver_id,
    'message_received',
    'New message from ' || COALESCE(_sender_name, 'Someone'),
    'رسالة جديدة من ' || COALESCE(_sender_name, 'شخص ما'),
    LEFT(NEW.content, 100),
    LEFT(NEW.content, 100),
    '/messages?conversation=' || NEW.conversation_id::text
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_message();

-- Trigger to create notification on verification status change
CREATE OR REPLACE FUNCTION public.notify_on_verification_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _business record;
  _owner_id uuid;
BEGIN
  IF NEW.status != OLD.status THEN
    SELECT * INTO _business
    FROM public.businesses
    WHERE id = NEW.business_id;
    
    _owner_id := _business.owner_id;
    
    IF NEW.status = 'approved' THEN
      PERFORM public.create_notification(
        _owner_id,
        'verification_approved',
        'Business Verified!',
        'تم التحقق من العمل!',
        'Your business "' || _business.name_en || '" has been verified.',
        'تم التحقق من عملك "' || _business.name_ar || '".',
        '/my-business'
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.create_notification(
        _owner_id,
        'verification_rejected',
        'Verification Rejected',
        'تم رفض التحقق',
        'Your verification request for "' || _business.name_en || '" was rejected. ' || COALESCE(NEW.rejection_reason, ''),
        'تم رفض طلب التحقق لـ "' || _business.name_ar || '". ' || COALESCE(NEW.rejection_reason, ''),
        '/my-business'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_verification_status_change
  AFTER UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_verification_change();

-- Trigger to notify interested users about new products
CREATE OR REPLACE FUNCTION public.notify_on_new_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _business record;
  _interested_user record;
BEGIN
  SELECT * INTO _business
  FROM public.businesses
  WHERE id = NEW.business_id;
  
  -- Notify users interested in this category
  FOR _interested_user IN
    SELECT ui.user_id, np.email_on_new_product
    FROM public.user_interests ui
    LEFT JOIN public.notification_preferences np ON np.user_id = ui.user_id
    WHERE NEW.category = ANY(ui.categories)
      AND ui.user_id != _business.owner_id
  LOOP
    PERFORM public.create_notification(
      _interested_user.user_id,
      'new_product_matching_interest',
      'New Product: ' || NEW.name_en,
      'منتج جديد: ' || NEW.name_ar,
      'A new product in ' || NEW.category || ' has been added by ' || _business.name_en,
      'تمت إضافة منتج جديد في ' || NEW.category || ' بواسطة ' || _business.name_ar,
      '/business/' || NEW.business_id::text
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_product_notify
  AFTER INSERT ON public.business_products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_product();

-- Trigger to notify interested users about new businesses
CREATE OR REPLACE FUNCTION public.notify_on_new_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _interested_user record;
BEGIN
  -- Notify users interested in this industry
  FOR _interested_user IN
    SELECT ui.user_id, np.email_on_new_business
    FROM public.user_interests ui
    LEFT JOIN public.notification_preferences np ON np.user_id = ui.user_id
    WHERE NEW.industry = ANY(ui.industries)
      AND ui.user_id != NEW.owner_id
  LOOP
    PERFORM public.create_notification(
      _interested_user.user_id,
      'new_business_in_industry',
      'New Business: ' || NEW.name_en,
      'عمل جديد: ' || NEW.name_ar,
      'A new business in ' || NEW.industry || ' has joined the platform.',
      'انضم عمل جديد في ' || NEW.industry || ' إلى المنصة.',
      '/business/' || NEW.id::text
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_business_notify
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_business();

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_user_interests_categories ON public.user_interests USING gin(categories);
CREATE INDEX idx_user_interests_industries ON public.user_interests USING gin(industries);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;