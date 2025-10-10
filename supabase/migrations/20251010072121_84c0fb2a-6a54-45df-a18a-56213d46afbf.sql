-- Add logistics-related fields to RFQ requests
ALTER TABLE public.rfq_requests
ADD COLUMN IF NOT EXISTS needs_logistics BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shipping_origin TEXT,
ADD COLUMN IF NOT EXISTS preferred_service_type TEXT;

-- Create RFQ logistics responses table
CREATE TABLE IF NOT EXISTS public.rfq_logistics_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_request_id UUID NOT NULL REFERENCES public.rfq_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.logistics_providers(id) ON DELETE CASCADE,
  quoted_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  estimated_transit_days INTEGER,
  service_type TEXT NOT NULL,
  route_details TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rfq_request_id, provider_id)
);

-- Enable RLS
ALTER TABLE public.rfq_logistics_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rfq_logistics_responses
CREATE POLICY "Logistics providers can create own responses"
  ON public.rfq_logistics_responses
  FOR INSERT
  WITH CHECK (provider_id IN (
    SELECT id FROM public.logistics_providers WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Logistics providers can view own responses"
  ON public.rfq_logistics_responses
  FOR SELECT
  USING (provider_id IN (
    SELECT id FROM public.logistics_providers WHERE owner_id = auth.uid()
  ));

CREATE POLICY "RFQ requesters can view responses to their RFQs"
  ON public.rfq_logistics_responses
  FOR SELECT
  USING (rfq_request_id IN (
    SELECT id FROM public.rfq_requests WHERE requester_id = auth.uid()
  ));

CREATE POLICY "Logistics providers can update own responses"
  ON public.rfq_logistics_responses
  FOR UPDATE
  USING (provider_id IN (
    SELECT id FROM public.logistics_providers WHERE owner_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_rfq_logistics_responses_updated_at
  BEFORE UPDATE ON public.rfq_logistics_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();