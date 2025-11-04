-- Create favorites table for wishlist feature
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  nft_id UUID NOT NULL REFERENCES public.nfts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_address, nft_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Policies for favorites
CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (true);

CREATE POLICY "Users can add favorites"
ON public.favorites FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can remove their favorites"
ON public.favorites FOR DELETE
USING (lower(user_address) = lower(user_address));

-- Add index for performance
CREATE INDEX idx_favorites_user_address ON public.favorites(user_address);
CREATE INDEX idx_favorites_nft_id ON public.favorites(nft_id);

-- Create view for trending NFTs (based on offer count and recent activity)
CREATE OR REPLACE VIEW public.trending_nfts AS
SELECT 
  n.*,
  COUNT(DISTINCT o.id) as offer_count,
  COUNT(DISTINCT t.id) as transaction_count,
  MAX(t.created_at) as last_activity
FROM public.nfts n
LEFT JOIN public.offers o ON n.id = o.nft_id AND o.active = true
LEFT JOIN public.transactions t ON n.id = t.nft_id
WHERE n.created_at > NOW() - INTERVAL '30 days'
GROUP BY n.id
ORDER BY offer_count DESC, transaction_count DESC, last_activity DESC NULLS LAST;