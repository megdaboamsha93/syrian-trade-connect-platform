-- Create business_reviews table for ratings and comments
CREATE TABLE IF NOT EXISTS public.business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, reviewer_id)
);

-- Enable RLS
ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Anyone can read reviews"
ON public.business_reviews
FOR SELECT
USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
ON public.business_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reviewer_id 
  AND auth.uid() != (SELECT owner_id FROM public.businesses WHERE id = business_id)
);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON public.business_reviews
FOR UPDATE
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON public.business_reviews
FOR DELETE
USING (auth.uid() = reviewer_id);

-- Add average rating and review count to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update business rating
CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Trigger to update rating on insert/update/delete
CREATE TRIGGER update_business_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.business_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_business_rating();

-- Add updated_at trigger for reviews
CREATE TRIGGER update_business_reviews_updated_at
BEFORE UPDATE ON public.business_reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();