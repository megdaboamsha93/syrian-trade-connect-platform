-- Create logistics providers table
CREATE TABLE public.logistics_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name_en TEXT NOT NULL,
  company_name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  logo_url TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website_url TEXT,
  service_types TEXT[] DEFAULT '{}', -- air, sea, land, rail, multimodal
  is_verified BOOLEAN DEFAULT false,
  average_rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipping routes table
CREATE TABLE public.shipping_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.logistics_providers(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  origin_country TEXT NOT NULL,
  origin_city TEXT,
  destination_country TEXT NOT NULL,
  destination_city TEXT,
  transit_time_days INTEGER,
  service_type TEXT NOT NULL, -- air, sea, land, rail
  is_active BOOLEAN DEFAULT true,
  frequency TEXT, -- daily, weekly, biweekly, monthly
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service areas table (regions covered)
CREATE TABLE public.service_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.logistics_providers(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  cities TEXT[], -- specific cities covered
  coverage_type TEXT NOT NULL, -- full, major_cities, specific
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.logistics_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for logistics_providers
CREATE POLICY "Anyone can view logistics providers"
  ON public.logistics_providers
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create own logistics provider"
  ON public.logistics_providers
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own logistics provider"
  ON public.logistics_providers
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own logistics provider"
  ON public.logistics_providers
  FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for shipping_routes
CREATE POLICY "Anyone can view active routes"
  ON public.shipping_routes
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Providers can create own routes"
  ON public.shipping_routes
  FOR INSERT
  WITH CHECK (provider_id IN (
    SELECT id FROM public.logistics_providers WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Providers can update own routes"
  ON public.shipping_routes
  FOR UPDATE
  USING (provider_id IN (
    SELECT id FROM public.logistics_providers WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Providers can delete own routes"
  ON public.shipping_routes
  FOR DELETE
  USING (provider_id IN (
    SELECT id FROM public.logistics_providers WHERE owner_id = auth.uid()
  ));

-- RLS Policies for service_areas
CREATE POLICY "Anyone can view service areas"
  ON public.service_areas
  FOR SELECT
  USING (true);

CREATE POLICY "Providers can create own service areas"
  ON public.service_areas
  FOR INSERT
  WITH CHECK (provider_id IN (
    SELECT id FROM public.logistics_providers WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Providers can update own service areas"
  ON public.service_areas
  FOR UPDATE
  USING (provider_id IN (
    SELECT id FROM public.logistics_providers WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Providers can delete own service areas"
  ON public.service_areas
  FOR DELETE
  USING (provider_id IN (
    SELECT id FROM public.logistics_providers WHERE owner_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_logistics_providers_updated_at
  BEFORE UPDATE ON public.logistics_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_shipping_routes_updated_at
  BEFORE UPDATE ON public.shipping_routes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();