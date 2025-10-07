-- Create translations table to cache AI translations
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_text, source_lang, target_lang, context)
);

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read translations (they're not sensitive)
CREATE POLICY "Anyone can read translations"
  ON public.translations
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert translations
CREATE POLICY "Authenticated users can insert translations"
  ON public.translations
  FOR INSERT
  WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_translations_lookup ON public.translations(source_text, source_lang, target_lang, context);