-- Make fridge-photos bucket public so edge functions can access images
UPDATE storage.buckets 
SET public = true 
WHERE id = 'fridge-photos';