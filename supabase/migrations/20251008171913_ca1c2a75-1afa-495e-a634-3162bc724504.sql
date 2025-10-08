-- Add is_government_account field to profiles
ALTER TABLE public.profiles
ADD COLUMN is_government_account boolean DEFAULT false;

-- Update business_settings to track government verification
ALTER TABLE public.business_settings
ADD COLUMN is_government_verified boolean DEFAULT false;

-- Insert sample public RFQs
INSERT INTO public.rfq_requests (
  requester_id,
  rfq_type,
  is_public,
  product_name,
  product_category,
  quantity,
  unit,
  budget_range,
  delivery_location,
  required_by,
  description,
  status
)
SELECT 
  b.owner_id,
  CASE 
    WHEN row_number() OVER () % 3 = 0 THEN 'governmental'
    ELSE 'open'
  END,
  true,
  CASE row_number() OVER ()
    WHEN 1 THEN 'Industrial Machinery Parts'
    WHEN 2 THEN 'Organic Olive Oil - Bulk'
    WHEN 3 THEN 'Server Infrastructure Equipment'
    WHEN 4 THEN 'Cotton Fabric Rolls'
    WHEN 5 THEN 'Petrochemical Resins'
    WHEN 6 THEN 'Damascus Steel Knives'
    ELSE 'Various Products'
  END,
  CASE row_number() OVER ()
    WHEN 1 THEN 'Industrial Equipment'
    WHEN 2 THEN 'Food & Agriculture'
    WHEN 3 THEN 'Technology'
    WHEN 4 THEN 'Textiles & Apparel'
    WHEN 5 THEN 'Petrochemicals'
    WHEN 6 THEN 'Crafts & Handicrafts'
    ELSE 'Electronics'
  END,
  CASE row_number() OVER ()
    WHEN 1 THEN '500 units'
    WHEN 2 THEN '10 tons'
    WHEN 3 THEN '20 units'
    WHEN 4 THEN '5000 meters'
    WHEN 5 THEN '50 tons'
    WHEN 6 THEN '200 pieces'
    ELSE '100 units'
  END,
  CASE row_number() OVER ()
    WHEN 1 THEN 'units'
    WHEN 2 THEN 'tons'
    WHEN 3 THEN 'servers'
    WHEN 4 THEN 'meters'
    WHEN 5 THEN 'tons'
    WHEN 6 THEN 'pieces'
    ELSE 'units'
  END,
  CASE row_number() OVER ()
    WHEN 1 THEN '$50,000-$100,000'
    WHEN 2 THEN '$20,000-$40,000'
    WHEN 3 THEN '$150,000-$300,000'
    WHEN 4 THEN '$30,000-$60,000'
    WHEN 5 THEN '$80,000-$150,000'
    WHEN 6 THEN '$10,000-$25,000'
    ELSE '$5,000-$15,000'
  END,
  CASE row_number() OVER ()
    WHEN 1 THEN 'Damascus, Syria'
    WHEN 2 THEN 'Aleppo, Syria'
    WHEN 3 THEN 'Damascus, Syria'
    WHEN 4 THEN 'Homs, Syria'
    WHEN 5 THEN 'Latakia, Syria'
    WHEN 6 THEN 'Damascus, Syria'
    ELSE 'Tartus, Syria'
  END,
  CURRENT_DATE + INTERVAL '30 days' * row_number() OVER (),
  CASE row_number() OVER ()
    WHEN 1 THEN 'Looking for high-quality industrial machinery replacement parts. Must meet ISO standards. Prefer local suppliers with warranty.'
    WHEN 2 THEN 'Need premium organic olive oil in bulk for export. Must have organic certification and quality testing reports.'
    WHEN 3 THEN 'Government tender for server infrastructure upgrade. Need enterprise-grade equipment with 5-year support contract.'
    WHEN 4 THEN 'High-quality cotton fabric for textile manufacturing. Looking for consistent supply with good pricing for long-term contract.'
    WHEN 5 THEN 'Industrial grade petrochemical resins for manufacturing. Must meet safety and environmental standards.'
    WHEN 6 THEN 'Traditional Damascus steel knives for cultural heritage project. Seeking authentic craftsmen with proven track record.'
    ELSE 'Various business needs. Contact for details.'
  END,
  'pending'
FROM businesses b
WHERE b.is_example = true
LIMIT 6;