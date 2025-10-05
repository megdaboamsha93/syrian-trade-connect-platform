-- Add is_example field to businesses table
ALTER TABLE public.businesses 
ADD COLUMN is_example boolean DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.businesses.is_example IS 'Marks businesses that are example/demo data for showcasing the platform';