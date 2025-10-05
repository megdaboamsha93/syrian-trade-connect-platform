-- Create favorites table for bookmarking businesses
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorites
CREATE POLICY "Users can view own favorites"
  ON public.favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorites"
  ON public.favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_business_id ON public.favorites(business_id);

-- Add full text search capabilities to businesses
CREATE INDEX IF NOT EXISTS idx_businesses_search 
  ON public.businesses 
  USING gin(to_tsvector('english', name_en || ' ' || COALESCE(description_en, '') || ' ' || industry));

CREATE INDEX IF NOT EXISTS idx_businesses_search_ar
  ON public.businesses 
  USING gin(to_tsvector('simple', name_ar || ' ' || COALESCE(description_ar, '')));

-- Add full text search to products
CREATE INDEX IF NOT EXISTS idx_products_search
  ON public.business_products
  USING gin(to_tsvector('english', name_en || ' ' || COALESCE(description_en, '') || ' ' || category));

CREATE INDEX IF NOT EXISTS idx_products_search_ar
  ON public.business_products
  USING gin(to_tsvector('simple', name_ar || ' ' || COALESCE(description_ar, '')));