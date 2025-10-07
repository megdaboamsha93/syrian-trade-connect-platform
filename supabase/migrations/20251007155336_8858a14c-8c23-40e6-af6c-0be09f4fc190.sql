-- Create verification_requests table to track business verification status
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, status)
);

-- Create verification_documents table to store uploaded verification documents
CREATE TABLE IF NOT EXISTS public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_request_id UUID NOT NULL REFERENCES public.verification_requests(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('business_license', 'tax_certificate', 'commercial_registration', 'identity_document', 'other')),
  document_url TEXT NOT NULL,
  document_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for verification_requests
CREATE POLICY "Business owners can view own verification requests"
  ON public.verification_requests FOR SELECT
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Business owners can create verification requests"
  ON public.verification_requests FOR INSERT
  WITH CHECK (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Admins can view all verification requests"
  ON public.verification_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verification requests"
  ON public.verification_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for verification_documents
CREATE POLICY "Business owners can view own documents"
  ON public.verification_documents FOR SELECT
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Business owners can upload documents"
  ON public.verification_documents FOR INSERT
  WITH CHECK (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Admins can view all documents"
  ON public.verification_documents FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_verification_requests_business_id ON public.verification_requests(business_id);
CREATE INDEX idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX idx_verification_documents_request_id ON public.verification_documents(verification_request_id);
CREATE INDEX idx_verification_documents_business_id ON public.verification_documents(business_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_verification_requests_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to update business verification status when request is approved
CREATE OR REPLACE FUNCTION public.handle_verification_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE public.businesses
    SET is_verified = true
    WHERE id = NEW.business_id;
  ELSIF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    UPDATE public.businesses
    SET is_verified = false
    WHERE id = NEW.business_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_verification_approval
  AFTER UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_verification_approval();