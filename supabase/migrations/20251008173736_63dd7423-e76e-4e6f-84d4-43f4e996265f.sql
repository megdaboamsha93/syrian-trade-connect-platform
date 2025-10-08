-- Fix RFQ data: separate quantity from unit
-- Update existing RFQ records to properly separate quantity and unit

UPDATE public.rfq_requests
SET 
  quantity = '500',
  unit = 'units'
WHERE product_name = 'Industrial Machinery Parts';

UPDATE public.rfq_requests
SET 
  quantity = '10',
  unit = 'tons'
WHERE product_name = 'Organic Olive Oil - Bulk';

UPDATE public.rfq_requests
SET 
  quantity = '20',
  unit = 'servers'
WHERE product_name = 'Server Infrastructure Equipment';

UPDATE public.rfq_requests
SET 
  quantity = '5000',
  unit = 'meters'
WHERE product_name = 'Cotton Fabric Rolls';

UPDATE public.rfq_requests
SET 
  quantity = '50',
  unit = 'tons'
WHERE product_name = 'Petrochemical Resins';

UPDATE public.rfq_requests
SET 
  quantity = '200',
  unit = 'pieces'
WHERE product_name = 'Damascus Steel Knives';

-- Create table for saved RFQ filters
CREATE TABLE IF NOT EXISTS public.rfq_filter_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filter_name TEXT NOT NULL,
  categories TEXT[] DEFAULT '{}',
  locations TEXT[] DEFAULT '{}',
  min_budget NUMERIC,
  max_budget NUMERIC,
  required_by_start DATE,
  required_by_end DATE,
  rfq_types TEXT[] DEFAULT '{}', -- 'open', 'governmental'
  notify_on_match BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on rfq_filter_preferences
ALTER TABLE public.rfq_filter_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for rfq_filter_preferences
CREATE POLICY "Users can view own filter preferences"
  ON public.rfq_filter_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own filter preferences"
  ON public.rfq_filter_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own filter preferences"
  ON public.rfq_filter_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own filter preferences"
  ON public.rfq_filter_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_rfq_filter_preferences_updated_at
  BEFORE UPDATE ON public.rfq_filter_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();