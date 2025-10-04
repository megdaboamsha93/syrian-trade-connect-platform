-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create enum for business types
CREATE TYPE public.business_type AS ENUM ('importer', 'exporter', 'both');

-- =====================================================
-- PROFILES TABLE
-- Description: Extended user information linked to auth.users
-- One user = one profile, auto-created on signup
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view profiles (for business owner info)
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- RLS: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- USER_ROLES TABLE
-- Description: Role-based access control for admin features
-- Links users to roles (admin, moderator, user)
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =====================================================
-- BUSINESSES TABLE
-- Description: Business profiles with multilingual support
-- One user = one business, stores importer/exporter info
-- =====================================================
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  business_type public.business_type NOT NULL,
  industry TEXT NOT NULL,
  location TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website_url TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view businesses (public browsing)
CREATE POLICY "Anyone can view businesses"
  ON public.businesses FOR SELECT
  USING (true);

-- RLS: Users can insert their own business
CREATE POLICY "Users can create own business"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- RLS: Users can update their own business
CREATE POLICY "Users can update own business"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = owner_id);

-- RLS: Admins can update any business (for verification)
CREATE POLICY "Admins can update any business"
  ON public.businesses FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- BUSINESS_PRODUCTS TABLE
-- Description: Products/services offered by businesses
-- Multilingual product catalog, one business = many products
-- =====================================================
CREATE TABLE public.business_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  category TEXT NOT NULL,
  price_range TEXT,
  minimum_order TEXT,
  image_urls TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on business_products
ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view active products
CREATE POLICY "Anyone can view products"
  ON public.business_products FOR SELECT
  USING (is_active = true);

-- RLS: Business owners can insert products for their business
CREATE POLICY "Owners can create products"
  ON public.business_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = business_id AND owner_id = auth.uid()
    )
  );

-- RLS: Business owners can update their products
CREATE POLICY "Owners can update products"
  ON public.business_products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = business_id AND owner_id = auth.uid()
    )
  );

-- RLS: Business owners can delete their products
CREATE POLICY "Owners can delete products"
  ON public.business_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = business_id AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- CONVERSATIONS TABLE
-- Description: Message threads between two users/businesses
-- Tracks participants and last activity
-- =====================================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  participant_2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  participant_1_unread INTEGER DEFAULT 0,
  participant_2_unread INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(participant_1_id, participant_2_id),
  CHECK (participant_1_id < participant_2_id)
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own conversations
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- RLS: Users can create conversations
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- RLS: Participants can update conversation metadata
CREATE POLICY "Participants can update conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- =====================================================
-- MESSAGES TABLE
-- Description: Individual messages within conversations
-- Contains message content, sender, read status
-- =====================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view messages in their conversations
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (auth.uid() = participant_1_id OR auth.uid() = participant_2_id)
    )
  );

-- RLS: Users can send messages in their conversations
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (auth.uid() = participant_1_id OR auth.uid() = participant_2_id)
    )
  );

-- RLS: Users can update messages they sent (for read status)
CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (auth.uid() = participant_1_id OR auth.uid() = participant_2_id)
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for profiles
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for businesses
CREATE TRIGGER set_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for business_products
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.business_products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX idx_businesses_type ON public.businesses(business_type);
CREATE INDEX idx_businesses_industry ON public.businesses(industry);
CREATE INDEX idx_products_business ON public.business_products(business_id);
CREATE INDEX idx_products_category ON public.business_products(category);
CREATE INDEX idx_conversations_participants ON public.conversations(participant_1_id, participant_2_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);