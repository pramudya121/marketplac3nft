-- Create storage bucket for NFT images
INSERT INTO storage.buckets (id, name, public)
VALUES ('nft-images', 'nft-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for public read access
CREATE POLICY "Public read access for NFT images"
ON storage.objects FOR SELECT
USING (bucket_id = 'nft-images');

-- Create storage policy for authenticated upload
CREATE POLICY "Authenticated users can upload NFT images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nft-images' AND auth.role() = 'authenticated');

-- Create NFTs table
CREATE TABLE public.nfts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  metadata_uri TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create listings table
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id INTEGER NOT NULL UNIQUE,
  nft_id UUID REFERENCES public.nfts(id) ON DELETE CASCADE,
  seller_address TEXT NOT NULL,
  price TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offers table
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID REFERENCES public.nfts(id) ON DELETE CASCADE,
  offerer_address TEXT NOT NULL,
  price TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID REFERENCES public.nfts(id) ON DELETE CASCADE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  price TEXT,
  transaction_type TEXT NOT NULL,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access (marketplace is public)
CREATE POLICY "Public can view all NFTs"
ON public.nfts FOR SELECT
USING (true);

CREATE POLICY "Public can view all listings"
ON public.listings FOR SELECT
USING (true);

CREATE POLICY "Public can view all offers"
ON public.offers FOR SELECT
USING (true);

CREATE POLICY "Public can view all transactions"
ON public.transactions FOR SELECT
USING (true);

-- RLS Policies for insert (anyone can create records)
CREATE POLICY "Anyone can insert NFTs"
ON public.nfts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can insert listings"
ON public.listings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can insert offers"
ON public.offers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can insert transactions"
ON public.transactions FOR INSERT
WITH CHECK (true);

-- RLS Policies for update
CREATE POLICY "Anyone can update NFTs"
ON public.nfts FOR UPDATE
USING (true);

CREATE POLICY "Anyone can update listings"
ON public.listings FOR UPDATE
USING (true);

CREATE POLICY "Anyone can update offers"
ON public.offers FOR UPDATE
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_nfts_token_id ON public.nfts(token_id);
CREATE INDEX idx_nfts_owner ON public.nfts(owner_address);
CREATE INDEX idx_listings_active ON public.listings(active);
CREATE INDEX idx_offers_active ON public.offers(active);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_nfts_updated_at
BEFORE UPDATE ON public.nfts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();