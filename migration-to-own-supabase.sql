-- ============================================
-- COMPLETE SUPABASE DATABASE MIGRATION
-- Run this SQL in your new Supabase project
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE app_role AS ENUM ('admin', 'moderator');
CREATE TYPE business_account_type AS ENUM ('free', 'premium', 'enterprise');
CREATE TYPE business_type AS ENUM ('manufacturer', 'distributor', 'service_provider', 'logistics_provider', 'both');

-- ============================================
-- TABLES
-- ============================================

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  business_type business_type,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  industry TEXT NOT NULL,
  business_type business_type NOT NULL,
  account_type business_account_type DEFAULT 'free',
  logo_url TEXT,
  cover_url TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  is_verified BOOLEAN DEFAULT false,
  average_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business products table
CREATE TABLE public.business_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification requests table
CREATE TABLE public.verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  documents JSONB,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  business_id UUID REFERENCES public.businesses(id),
  product_id UUID REFERENCES public.business_products(id),
  status TEXT DEFAULT 'pending',
  total_amount NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_1_unread INTEGER DEFAULT 0,
  participant_2_unread INTEGER DEFAULT 0,
  participant_1_muted BOOLEAN DEFAULT false,
  participant_2_muted BOOLEAN DEFAULT false,
  participant_1_blocked BOOLEAN DEFAULT false,
  participant_2_blocked BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT conversations_check CHECK (participant_1_id < participant_2_id)
);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  content_en TEXT,
  content_ar TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_on_new_message BOOLEAN DEFAULT true,
  email_on_new_product BOOLEAN DEFAULT true,
  email_on_new_business BOOLEAN DEFAULT true,
  notify_rfq_open BOOLEAN DEFAULT true,
  notify_rfq_governmental BOOLEAN DEFAULT true,
  notify_rfq_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interests table
CREATE TABLE public.user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  categories TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business views table
CREATE TABLE public.business_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product views table
CREATE TABLE public.product_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.business_products(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business reviews table
CREATE TABLE public.business_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, reviewer_id)
);

-- RFQ requests table
CREATE TABLE public.rfq_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rfq_type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_category TEXT NOT NULL,
  description TEXT,
  quantity INTEGER,
  unit TEXT,
  budget NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  deadline TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translations cache table
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text_hash TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(text_hash, source_lang, target_lang, context)
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
  );
  RETURN NEW;
END;
$$;

-- Handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is logistics provider
CREATE OR REPLACE FUNCTION public.is_logistics_provider(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND business_type IN ('logistics_provider', 'both')
  )
$$;

-- Handle verification approval
CREATE OR REPLACE FUNCTION public.handle_verification_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE public.businesses
    SET is_verified = true
    WHERE id = NEW.business_id;
  ELSIF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    UPDATE public.businesses
    SET is_verified = false
    WHERE id = NEW.business_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_number TEXT;
  prefix TEXT := 'ORD';
  random_suffix TEXT;
BEGIN
  random_suffix := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  new_number := prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || random_suffix;
  
  WHILE EXISTS (SELECT 1 FROM public.orders WHERE order_number = new_number) LOOP
    random_suffix := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    new_number := prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || random_suffix;
  END LOOP;
  
  RETURN new_number;
END;
$$;

-- Conversation management functions
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(_participant_1_id UUID, _participant_2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _conversation_id UUID;
  _p1 UUID;
  _p2 UUID;
BEGIN
  IF _participant_1_id < _participant_2_id THEN
    _p1 := _participant_1_id;
    _p2 := _participant_2_id;
  ELSE
    _p1 := _participant_2_id;
    _p2 := _participant_1_id;
  END IF;

  IF _p1 = _p2 THEN
    RAISE EXCEPTION 'Cannot create a conversation with yourself';
  END IF;

  SELECT id INTO _conversation_id
  FROM public.conversations
  WHERE participant_1_id = _p1 AND participant_2_id = _p2
  LIMIT 1;

  IF _conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id)
    VALUES (_p1, _p2)
    RETURNING id INTO _conversation_id;
  END IF;

  RETURN _conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_conversation_for_user(_conversation_id UUID, _user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _conversation RECORD;
BEGIN
  SELECT * INTO _conversation
  FROM conversations
  WHERE id = _conversation_id;
  
  IF _conversation.participant_1_id != _user_id AND _conversation.participant_2_id != _user_id THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;
  
  DELETE FROM conversations WHERE id = _conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_messages_read(_conversation_id UUID, _user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _conversation RECORD;
BEGIN
  SELECT * INTO _conversation
  FROM public.conversations
  WHERE id = _conversation_id;
  
  IF _conversation.participant_1_id != _user_id AND _conversation.participant_2_id != _user_id THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;
  
  UPDATE public.messages
  SET is_read = true
  WHERE conversation_id = _conversation_id
    AND sender_id != _user_id
    AND is_read = false;
  
  IF _conversation.participant_1_id = _user_id THEN
    UPDATE public.conversations
    SET participant_1_unread = 0
    WHERE id = _conversation_id;
  ELSE
    UPDATE public.conversations
    SET participant_2_unread = 0
    WHERE id = _conversation_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_conversation_block(_conversation_id UUID, _user_id UUID, _blocked BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _conversation RECORD;
BEGIN
  SELECT * INTO _conversation
  FROM conversations
  WHERE id = _conversation_id;
  
  IF _conversation.participant_1_id != _user_id AND _conversation.participant_2_id != _user_id THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;
  
  IF _conversation.participant_1_id = _user_id THEN
    UPDATE conversations
    SET participant_1_blocked = _blocked
    WHERE id = _conversation_id;
  ELSE
    UPDATE conversations
    SET participant_2_blocked = _blocked
    WHERE id = _conversation_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_conversation_mute(_conversation_id UUID, _user_id UUID, _muted BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _conversation RECORD;
BEGIN
  SELECT * INTO _conversation
  FROM conversations
  WHERE id = _conversation_id;
  
  IF _conversation.participant_1_id != _user_id AND _conversation.participant_2_id != _user_id THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;
  
  IF _conversation.participant_1_id = _user_id THEN
    UPDATE conversations
    SET participant_1_muted = _muted
    WHERE id = _conversation_id;
  ELSE
    UPDATE conversations
    SET participant_2_muted = _muted
    WHERE id = _conversation_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _conversation RECORD;
BEGIN
  SELECT * INTO _conversation
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  IF _conversation.participant_1_id = NEW.sender_id THEN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at,
        participant_2_unread = participant_2_unread + 1
    WHERE id = NEW.conversation_id;
  ELSE
    UPDATE public.conversations
    SET last_message_at = NEW.created_at,
        participant_1_unread = participant_1_unread + 1
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Notification functions
CREATE OR REPLACE FUNCTION public.create_notification(_user_id UUID, _type TEXT, _title_en TEXT, _title_ar TEXT, _content_en TEXT, _content_ar TEXT, _link TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title_en, title_ar, content_en, content_ar, link)
  VALUES (_user_id, _type, _title_en, _title_ar, _content_en, _content_ar, _link)
  RETURNING id INTO _notification_id;
  
  RETURN _notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(_notification_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE id = ANY(_notification_ids)
    AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE user_id = auth.uid()
    AND is_read = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unread_notification_count(_user_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)
  FROM public.notifications
  WHERE user_id = _user_id
    AND is_read = false;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _receiver_id UUID;
  _sender_name TEXT;
  _conversation RECORD;
BEGIN
  SELECT * INTO _conversation
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  IF _conversation.participant_1_id = NEW.sender_id THEN
    _receiver_id := _conversation.participant_2_id;
  ELSE
    _receiver_id := _conversation.participant_1_id;
  END IF;
  
  SELECT full_name INTO _sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;
  
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

CREATE OR REPLACE FUNCTION public.notify_on_verification_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _business RECORD;
  _owner_id UUID;
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

-- Analytics functions
CREATE OR REPLACE FUNCTION public.get_business_daily_views(_business_id UUID, _days INTEGER DEFAULT 30)
RETURNS TABLE(date DATE, view_count BIGINT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    DATE(viewed_at) as date,
    COUNT(*) as view_count
  FROM public.business_views
  WHERE business_id = _business_id
    AND viewed_at >= NOW() - INTERVAL '1 day' * _days
  GROUP BY DATE(viewed_at)
  ORDER BY date DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_product_engagement(_business_id UUID, _days INTEGER DEFAULT 30)
RETURNS TABLE(product_id UUID, product_name TEXT, view_count BIGINT, unique_viewers BIGINT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    pv.product_id,
    COALESCE(bp.name_en, 'Unknown') as product_name,
    COUNT(*) as view_count,
    COUNT(DISTINCT pv.viewer_id) as unique_viewers
  FROM public.product_views pv
  LEFT JOIN public.business_products bp ON bp.id = pv.product_id
  WHERE pv.business_id = _business_id
    AND pv.viewed_at >= NOW() - INTERVAL '1 day' * _days
  GROUP BY pv.product_id, bp.name_en
  ORDER BY view_count DESC;
$$;

-- Business notification functions
CREATE OR REPLACE FUNCTION public.notify_on_new_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _business RECORD;
  _interested_user RECORD;
BEGIN
  SELECT * INTO _business
  FROM public.businesses
  WHERE id = NEW.business_id;
  
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

CREATE OR REPLACE FUNCTION public.notify_on_new_business()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _interested_user RECORD;
BEGIN
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

CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.businesses
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.business_reviews
      WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.business_reviews
      WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    )
  WHERE id = COALESCE(NEW.business_id, OLD.business_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_open_rfq()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _interested_user RECORD;
BEGIN
  IF NEW.is_public = true THEN
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

-- ============================================
-- TRIGGERS
-- ============================================

-- Auth triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_business_products_updated_at
  BEFORE UPDATE ON public.business_products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_business_reviews_updated_at
  BEFORE UPDATE ON public.business_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_rfq_requests_updated_at
  BEFORE UPDATE ON public.rfq_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_interests_updated_at
  BEFORE UPDATE ON public.user_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Business triggers
CREATE TRIGGER on_verification_status_change
  AFTER UPDATE ON public.verification_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_verification_approval();

CREATE TRIGGER on_new_product_created
  AFTER INSERT ON public.business_products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_product();

CREATE TRIGGER on_new_business_created
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_business();

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.business_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_rating();

-- Message triggers
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message();

CREATE TRIGGER on_message_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_message();

-- RFQ triggers
CREATE TRIGGER on_rfq_published
  AFTER INSERT ON public.rfq_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_open_rfq();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "User roles viewable by authenticated users"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Businesses policies
CREATE POLICY "Businesses are viewable by everyone"
  ON public.businesses FOR SELECT
  USING (true);

CREATE POLICY "Users can create own business"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own business"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own business"
  ON public.businesses FOR DELETE
  USING (auth.uid() = owner_id);

-- Business products policies
CREATE POLICY "Products are viewable by everyone"
  ON public.business_products FOR SELECT
  USING (true);

CREATE POLICY "Business owners can manage products"
  ON public.business_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = business_products.business_id
      AND owner_id = auth.uid()
    )
  );

-- Verification requests policies
CREATE POLICY "Users can view own verification requests"
  ON public.verification_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = verification_requests.business_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can create verification requests"
  ON public.verification_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = business_id
      AND owner_id = auth.uid()
    )
  );

-- Orders policies
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() IN (buyer_id, seller_id));

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants can update orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() IN (buyer_id, seller_id));

-- Conversations policies
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() IN (participant_1_id, participant_2_id));

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() IN (participant_1_id, participant_2_id));

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() IN (participant_1_id, participant_2_id));

CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() IN (participant_1_id, participant_2_id));

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND auth.uid() IN (participant_1_id, participant_2_id)
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND auth.uid() IN (participant_1_id, participant_2_id)
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- User interests policies
CREATE POLICY "Users can view own interests"
  ON public.user_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own interests"
  ON public.user_interests FOR ALL
  USING (auth.uid() = user_id);

-- Business views policies
CREATE POLICY "Anyone can record business views"
  ON public.business_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Business owners can view their analytics"
  ON public.business_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = business_views.business_id
      AND owner_id = auth.uid()
    )
  );

-- Product views policies
CREATE POLICY "Anyone can record product views"
  ON public.product_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Business owners can view product analytics"
  ON public.product_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = product_views.business_id
      AND owner_id = auth.uid()
    )
  );

-- Business reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON public.business_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.business_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews"
  ON public.business_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete own reviews"
  ON public.business_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- RFQ requests policies
CREATE POLICY "Public RFQs are viewable by everyone"
  ON public.rfq_requests FOR SELECT
  USING (is_public = true OR auth.uid() = requester_id);

CREATE POLICY "Users can create RFQ requests"
  ON public.rfq_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own RFQ requests"
  ON public.rfq_requests FOR UPDATE
  USING (auth.uid() = requester_id);

CREATE POLICY "Users can delete own RFQ requests"
  ON public.rfq_requests FOR DELETE
  USING (auth.uid() = requester_id);

-- Translations policies (allow authenticated users to read/write)
CREATE POLICY "Authenticated users can view translations"
  ON public.translations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create translations"
  ON public.translations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Note: Storage buckets need to be created via Supabase Dashboard
-- Required buckets:
-- 1. business-logos (public)
-- 2. business-covers (public)
-- 3. business-documents (private)
-- 4. product-images (public)
-- 5. review-media (public)

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX idx_businesses_industry ON public.businesses(industry);
CREATE INDEX idx_business_products_business_id ON public.business_products(business_id);
CREATE INDEX idx_business_products_category ON public.business_products(category);
CREATE INDEX idx_conversations_participants ON public.conversations(participant_1_id, participant_2_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_business_views_business_id ON public.business_views(business_id);
CREATE INDEX idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX idx_business_reviews_business_id ON public.business_reviews(business_id);
CREATE INDEX idx_rfq_requests_requester_id ON public.rfq_requests(requester_id);
CREATE INDEX idx_translations_hash ON public.translations(text_hash, source_lang, target_lang);

-- ============================================
-- REALTIME CONFIGURATION
-- ============================================

-- Enable realtime for messages (configure in Supabase Dashboard → Database → Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
