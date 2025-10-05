-- Create business_views table for tracking profile visits
CREATE TABLE IF NOT EXISTS public.business_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  referrer text,
  user_agent text
);

-- Create product_views table for tracking product engagement
CREATE TABLE IF NOT EXISTS public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.business_products(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  referrer text
);

-- Enable RLS
ALTER TABLE public.business_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_views
CREATE POLICY "Anyone can create business views"
  ON public.business_views
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Business owners can view their analytics"
  ON public.business_views
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- RLS policies for product_views
CREATE POLICY "Anyone can create product views"
  ON public.product_views
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Business owners can view product analytics"
  ON public.product_views
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_business_views_business_id ON public.business_views(business_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_views_viewed_at ON public.business_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON public.product_views(product_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_business_id ON public.product_views(business_id, viewed_at DESC);

-- Function to get daily view counts for a business
CREATE OR REPLACE FUNCTION public.get_business_daily_views(
  _business_id uuid,
  _days integer DEFAULT 30
)
RETURNS TABLE (
  date date,
  view_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Function to get product engagement summary
CREATE OR REPLACE FUNCTION public.get_product_engagement(
  _business_id uuid,
  _days integer DEFAULT 30
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  view_count bigint,
  unique_viewers bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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