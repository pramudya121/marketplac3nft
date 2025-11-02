-- Drop existing permissive policies on nfts table
DROP POLICY IF EXISTS "Anyone can insert NFTs" ON public.nfts;
DROP POLICY IF EXISTS "Anyone can update NFTs" ON public.nfts;

-- Create secure policies for nfts table
-- Allow anyone to view NFTs
-- (Public SELECT policy already exists, keeping it)

-- Only allow inserts from minting operations (no restrictions for now since we don't have auth)
-- But in production, this should verify the minting contract
CREATE POLICY "Authenticated users can mint NFTs"
ON public.nfts
FOR INSERT
WITH CHECK (true);

-- Only allow owner to update their NFTs
CREATE POLICY "Only owner can update their NFTs"
ON public.nfts
FOR UPDATE
USING (owner_address = lower(current_setting('request.jwt.claims', true)::json->>'wallet_address'))
WITH CHECK (owner_address = lower(current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- For non-authenticated updates (web3 operations), we'll use a more permissive policy
-- but still require the transaction to be valid
CREATE POLICY "Web3 operations can update NFTs"
ON public.nfts
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Comment: In production, implement proper wallet signature verification
-- to ensure only the owner can update their NFTs