-- Add missing fields to businesses table for Browse feature
ALTER TABLE public.businesses
ADD COLUMN cover_url text,
ADD COLUMN founded_year integer;

-- Add table and column descriptions for documentation
COMMENT ON TABLE public.businesses IS 'Stores business profiles for the B2B marketplace. Businesses can be importers, exporters, or both. Supports multilingual content (English/Arabic).';
COMMENT ON COLUMN public.businesses.id IS 'Unique identifier for the business';
COMMENT ON COLUMN public.businesses.owner_id IS 'References auth.users - the user who owns/manages this business';
COMMENT ON COLUMN public.businesses.business_type IS 'Type of business: importer, exporter, or both';
COMMENT ON COLUMN public.businesses.name_en IS 'Business name in English';
COMMENT ON COLUMN public.businesses.name_ar IS 'Business name in Arabic';
COMMENT ON COLUMN public.businesses.description_en IS 'Business description in English';
COMMENT ON COLUMN public.businesses.description_ar IS 'Business description in Arabic';
COMMENT ON COLUMN public.businesses.industry IS 'Industry category (manufacturing, agriculture, textiles, materials, services)';
COMMENT ON COLUMN public.businesses.location IS 'Physical location/address of the business';
COMMENT ON COLUMN public.businesses.contact_email IS 'Primary contact email';
COMMENT ON COLUMN public.businesses.contact_phone IS 'Primary contact phone number';
COMMENT ON COLUMN public.businesses.website_url IS 'Company website URL';
COMMENT ON COLUMN public.businesses.logo_url IS 'URL to business logo image';
COMMENT ON COLUMN public.businesses.cover_url IS 'URL to business cover/banner image for listings';
COMMENT ON COLUMN public.businesses.founded_year IS 'Year the business was founded';
COMMENT ON COLUMN public.businesses.is_verified IS 'Whether the business has been verified by admins';

COMMENT ON TABLE public.business_products IS 'Products offered by businesses. Each product belongs to one business and supports multilingual descriptions.';
COMMENT ON COLUMN public.business_products.business_id IS 'Foreign key to businesses table';
COMMENT ON COLUMN public.business_products.name_en IS 'Product name in English';
COMMENT ON COLUMN public.business_products.name_ar IS 'Product name in Arabic';
COMMENT ON COLUMN public.business_products.description_en IS 'Product description in English';
COMMENT ON COLUMN public.business_products.description_ar IS 'Product description in Arabic';
COMMENT ON COLUMN public.business_products.category IS 'Product category for filtering';
COMMENT ON COLUMN public.business_products.image_urls IS 'Array of product image URLs';
COMMENT ON COLUMN public.business_products.price_range IS 'Price range or pricing information';
COMMENT ON COLUMN public.business_products.minimum_order IS 'Minimum order quantity/requirements';
COMMENT ON COLUMN public.business_products.is_active IS 'Whether the product is currently available';

COMMENT ON TABLE public.profiles IS 'User profiles with additional information beyond auth.users. Auto-created on user signup.';
COMMENT ON TABLE public.user_roles IS 'User role assignments for access control. Separate from profiles for security.';
COMMENT ON TABLE public.conversations IS 'Peer-to-peer conversations between users for business inquiries.';
COMMENT ON TABLE public.messages IS 'Individual messages within conversations.';