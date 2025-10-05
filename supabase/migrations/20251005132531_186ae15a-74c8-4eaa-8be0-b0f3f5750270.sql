-- Create storage buckets for business assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('business-logos', 'business-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('business-covers', 'business-covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('business-documents', 'business-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[]),
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]);

-- RLS Policies for business-logos bucket
CREATE POLICY "Anyone can view business logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-logos');

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-logos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for business-covers bucket
CREATE POLICY "Anyone can view business covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-covers');

CREATE POLICY "Authenticated users can upload covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-covers' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for business-documents bucket (private)
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'business-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for product-images bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);