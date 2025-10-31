-- Enable RLS on storage.objects if not already enabled
-- This is required for all storage operations

-- Create policy to allow anyone to upload to nft-images bucket
CREATE POLICY "Allow public uploads to nft-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'nft-images');

-- Create policy to allow anyone to read from nft-images bucket
CREATE POLICY "Allow public reads from nft-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'nft-images');

-- Create policy to allow anyone to update files in nft-images bucket
CREATE POLICY "Allow public updates to nft-images"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'nft-images')
WITH CHECK (bucket_id = 'nft-images');

-- Create policy to allow anyone to delete from nft-images bucket
CREATE POLICY "Allow public deletes from nft-images"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'nft-images');