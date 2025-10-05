-- Remove unique constraint on owner_id to allow users to register multiple businesses
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_owner_id_key;