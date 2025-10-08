-- Create business_settings table for company preferences
CREATE TABLE public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  platform_contact_name TEXT,
  platform_contact_phone TEXT,
  platform_contact_email TEXT,
  looking_for TEXT[], -- Array of what they're seeking (e.g., 'suppliers', 'buyers', 'partners')
  accept_messages BOOLEAN DEFAULT true,
  accept_rfqs BOOLEAN DEFAULT true,
  sales_method TEXT, -- 'wholesale', 'retail', 'both', 'custom'
  minimum_order_value NUMERIC,
  payment_terms TEXT,
  delivery_terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on business_settings
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Policies for business_settings
CREATE POLICY "Business owners can view own settings"
ON public.business_settings FOR SELECT
USING (business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

CREATE POLICY "Business owners can insert own settings"
ON public.business_settings FOR INSERT
WITH CHECK (business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

CREATE POLICY "Business owners can update own settings"
ON public.business_settings FOR UPDATE
USING (business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

-- Create RFQ requests table
CREATE TABLE public.rfq_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_category TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  unit TEXT,
  description TEXT,
  required_by DATE,
  budget_range TEXT,
  delivery_location TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'quoted', 'accepted', 'rejected', 'expired'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on rfq_requests
ALTER TABLE public.rfq_requests ENABLE ROW LEVEL SECURITY;

-- Policies for rfq_requests
CREATE POLICY "Users can create RFQ requests"
ON public.rfq_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can view own RFQ requests"
ON public.rfq_requests FOR SELECT
USING (auth.uid() = requester_id);

CREATE POLICY "Business owners can view RFQs for their business"
ON public.rfq_requests FOR SELECT
USING (target_business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

CREATE POLICY "Requesters can update own RFQs"
ON public.rfq_requests FOR UPDATE
USING (auth.uid() = requester_id);

-- Create RFQ responses table
CREATE TABLE public.rfq_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_request_id UUID NOT NULL REFERENCES public.rfq_requests(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  quoted_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  unit_price NUMERIC,
  lead_time TEXT,
  validity_period TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(rfq_request_id, business_id)
);

-- Enable RLS on rfq_responses
ALTER TABLE public.rfq_responses ENABLE ROW LEVEL SECURITY;

-- Policies for rfq_responses
CREATE POLICY "Business owners can create responses"
ON public.rfq_responses FOR INSERT
WITH CHECK (business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

CREATE POLICY "Business owners can view own responses"
ON public.rfq_responses FOR SELECT
USING (business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

CREATE POLICY "RFQ requesters can view responses to their RFQs"
ON public.rfq_responses FOR SELECT
USING (rfq_request_id IN (
  SELECT id FROM public.rfq_requests WHERE requester_id = auth.uid()
));

CREATE POLICY "Business owners can update own responses"
ON public.rfq_responses FOR UPDATE
USING (business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

-- Add media_urls to business_reviews for image/video uploads
ALTER TABLE public.business_reviews
ADD COLUMN media_urls TEXT[] DEFAULT '{}';

-- Create storage bucket for review media
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review media
CREATE POLICY "Anyone can view review media"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-media');

CREATE POLICY "Authenticated users can upload review media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-media' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update own review media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'review-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own review media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'review-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger for updated_at on business_settings
CREATE TRIGGER update_business_settings_updated_at
BEFORE UPDATE ON public.business_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for updated_at on rfq_requests
CREATE TRIGGER update_rfq_requests_updated_at
BEFORE UPDATE ON public.rfq_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for updated_at on rfq_responses
CREATE TRIGGER update_rfq_responses_updated_at
BEFORE UPDATE ON public.rfq_responses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();