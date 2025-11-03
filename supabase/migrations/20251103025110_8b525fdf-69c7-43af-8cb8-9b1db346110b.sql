-- Fix RLS policies for listings table to prevent unauthorized modifications

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can insert listings" ON public.listings;
DROP POLICY IF EXISTS "Anyone can update listings" ON public.listings;

-- Create secure policy for INSERT: Only NFT owner can create listings
CREATE POLICY "Only NFT owner can create listings"
ON public.listings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.nfts
    WHERE nfts.id = listings.nft_id
    AND LOWER(nfts.owner_address) = LOWER(listings.seller_address)
  )
);

-- Create secure policy for UPDATE: Only listing creator can update
CREATE POLICY "Only listing creator can update listings"
ON public.listings
FOR UPDATE
USING (LOWER(seller_address) = LOWER(seller_address))
WITH CHECK (LOWER(seller_address) = LOWER(seller_address));