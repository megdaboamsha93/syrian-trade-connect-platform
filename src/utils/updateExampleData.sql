-- SQL script to update example businesses with generated images
-- Run this in your Supabase SQL editor to add images to existing example data

-- Update example businesses with cover images
UPDATE businesses 
SET cover_url = '/images/business-1.jpg'
WHERE is_example = true 
AND industry = 'manufacturing'
LIMIT 1;

UPDATE businesses 
SET cover_url = '/images/business-2.jpg'
WHERE is_example = true 
AND industry = 'agriculture'
LIMIT 1;

UPDATE businesses 
SET cover_url = '/images/business-3.jpg'
WHERE is_example = true 
AND industry = 'textiles'
LIMIT 1;

-- Update example products with images
UPDATE business_products
SET image_urls = ARRAY['/images/product-1.jpg']
WHERE category = 'Food & Beverages'
AND is_active = true
LIMIT 1;

UPDATE business_products
SET image_urls = ARRAY['/images/product-2.jpg']
WHERE category = 'Textiles & Fabrics'
AND is_active = true
LIMIT 1;

UPDATE business_products
SET image_urls = ARRAY['/images/product-3.jpg']
WHERE category = 'Industrial Equipment'
AND is_active = true
LIMIT 1;

-- Note: You can also manually update specific businesses/products by their IDs
-- Example:
-- UPDATE businesses SET cover_url = '/images/business-1.jpg' WHERE id = 'your-business-id';