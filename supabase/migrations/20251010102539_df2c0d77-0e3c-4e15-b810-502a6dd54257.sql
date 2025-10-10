-- Create orders table for order management pipeline
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_request_id UUID NOT NULL REFERENCES public.rfq_requests(id) ON DELETE CASCADE,
  rfq_response_id UUID REFERENCES public.rfq_responses(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_production', 'ready_to_ship', 'in_transit', 'delivered', 'completed', 'cancelled')),
  
  -- Order details
  product_name TEXT NOT NULL,
  product_category TEXT NOT NULL,
  quantity TEXT NOT NULL,
  unit TEXT,
  agreed_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Delivery information
  delivery_location TEXT NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  
  -- Additional details
  payment_terms TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'paid', 'refunded')),
  notes TEXT,
  terms_and_conditions TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Buyers can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view orders for their businesses"
ON public.orders FOR SELECT
USING (seller_business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

CREATE POLICY "Buyers can create orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their own orders"
ON public.orders FOR UPDATE
USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update orders for their businesses"
ON public.orders FOR UPDATE
USING (seller_business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  prefix TEXT := 'ORD';
  random_suffix TEXT;
BEGIN
  random_suffix := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  new_number := prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || random_suffix;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.orders WHERE order_number = new_number) LOOP
    random_suffix := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    new_number := prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || random_suffix;
  END LOOP;
  
  RETURN new_number;
END;
$$;

-- Create indexes for better query performance
CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller_business_id ON public.orders(seller_business_id);
CREATE INDEX idx_orders_rfq_request_id ON public.orders(rfq_request_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);