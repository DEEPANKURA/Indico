-- Expand storage bucket capacity limits to safely accommodate high-resolution videos and assets up to 500MB
-- Resolves 'The object exceeded the maximum allowed size' bucket restrictions

UPDATE storage.buckets 
SET file_size_limit = 524288000 
WHERE id IN ('media', 'avatars');
