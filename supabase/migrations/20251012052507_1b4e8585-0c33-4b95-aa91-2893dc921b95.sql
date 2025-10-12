-- Add business_type to profiles table
DO $$ BEGIN
  CREATE TYPE business_account_type AS ENUM ('standard', 'logistics_provider', 'both');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_type business_account_type DEFAULT 'standard';

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_business_type ON public.profiles(business_type);

-- Add helper function to check if user is logistics provider
CREATE OR REPLACE FUNCTION public.is_logistics_provider(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND business_type IN ('logistics_provider', 'both')
  )
$$;