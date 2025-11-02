import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { NFTGrid } from "@/components/NFTGrid";
import { FilterSort } from "@/components/FilterSort";
import { WalletConnect } from "@/components/WalletConnect";
import { SakuraAnimation } from "@/components/SakuraAnimation";
import { NFTDetailsModal } from "@/components/NFTDetailsModal";
import { buyNFT, getSigner } from "@/lib/web3";
import { toast } from "sonner";

interface NFT {
  id: string;
  name: string;
  description: string;
  image_url: string;
  owner_address: string;
  token_id: number;
  contract_address: string;
  metadata_uri: string;
  listing?: {
    listing_id: number;
    price: string;
    active: boolean;
    seller_address?: string;
  };
}

const Marketplace = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  useEffect(() => {
    loadNFTs();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [nfts, sortBy]);

  const applyFiltersAndSort = () => {
    // Only show NFTs with active listings in marketplace
    let filtered = nfts.filter(nft => nft.listing?.active);

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.id).getTime() - new Date(a.id).getTime();
        case "oldest":
          return new Date(a.id).getTime() - new Date(b.id).getTime();
        case "price_low":
          const priceA = a.listing ? parseFloat(a.listing.price) : Infinity;
          const priceB = b.listing ? parseFloat(b.listing.price) : Infinity;
          return priceA - priceB;
        case "price_high":
          const priceAHigh = a.listing ? parseFloat(a.listing.price) : -Infinity;
          const priceBHigh = b.listing ? parseFloat(b.listing.price) : -Infinity;
          return priceBHigh - priceAHigh;
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    setFilteredNfts(filtered);
  };

  const handleBuyNFT = async (nft: NFT) => {
    if (!nft.listing) {
      toast.error("This NFT is not listed for sale");
      return;
    }

    try {
      const signer = await getSigner();
      if (!signer) {
        toast.error("Please connect your wallet first");
        return;
      }

      const buyerAddress = await signer.getAddress();
      const buyerAddressLower = buyerAddress.toLowerCase();
      
      // Check if buyer is not the seller
      if (buyerAddressLower === nft.owner_address.toLowerCase()) {
        toast.error("You cannot buy your own NFT");
        return;
      }

      console.log("Buying NFT with listing_id:", nft.listing.listing_id);
      console.log("Price:", nft.listing.price);

      const success = await buyNFT(nft.listing.listing_id, nft.listing.price);
      
      if (success) {
        console.log("Buy successful, updating database...");
        
        // Update database - mark listing as inactive
        const { error: listingError } = await supabase
          .from("listings")
          .update({ active: false })
          .eq("listing_id", nft.listing.listing_id);
        
        if (listingError) {
          console.error("Error updating listing:", listingError);
        }

        // Update NFT owner
        const { error: nftError } = await supabase
          .from("nfts")
          .update({ owner_address: buyerAddressLower })
          .eq("id", nft.id);
        
        if (nftError) {
          console.error("Error updating NFT owner:", nftError);
        }

        // Record transaction with price in HLS (converted from Wei)
        const priceInHLS = (parseFloat(nft.listing.price) / 1e18).toFixed(4);
        const { error: txError } = await supabase.from("transactions").insert({
          nft_id: nft.id,
          from_address: nft.listing.seller_address || nft.owner_address,
          to_address: buyerAddressLower,
          transaction_type: "sale",
          price: priceInHLS,
        });
        
        if (txError) {
          console.error("Error recording transaction:", txError);
        }

        console.log("Database updated successfully");
        await loadNFTs();
        setDetailsModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error in handleBuyNFT:", error);
      toast.error(`Error buying NFT: ${error.message || "Unknown error"}`);
    }
  };

  const handleViewDetails = (nft: NFT) => {
    setSelectedNFT(nft);
    setDetailsModalOpen(true);
  };

  const loadNFTs = async () => {
    try {
      setLoading(true);
      const { data: nftsData, error: nftsError } = await supabase
        .from("nfts")
        .select("*")
        .order("created_at", { ascending: false });

      if (nftsError) throw nftsError;

      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .eq("active", true);

      if (listingsError) throw listingsError;

      const nftsWithListings = nftsData?.map((nft) => {
        const listing = listingsData?.find((l) => l.nft_id === nft.id);
        return {
          ...nft,
          listing: listing
            ? {
                listing_id: listing.listing_id,
                price: listing.price,
                active: listing.active,
                seller_address: listing.seller_address,
              }
            : undefined,
        };
      });

      setNfts(nftsWithListings || []);
      setFilteredNfts(nftsWithListings || []);
    } catch (error) {
      console.error("Error loading NFTs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <SakuraAnimation />
      
      {/* Navbar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Helios NFT
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/marketplace">
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link to="/mint">
              <Button variant="ghost">Mint NFT</Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
            <Link to="/activity">
              <Button variant="ghost">Activity</Button>
            </Link>
            <Link to="/statistics">
              <Button variant="ghost">Statistics</Button>
            </Link>
            <WalletConnect />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">NFT Marketplace</h1>
            <p className="text-muted-foreground">
              Discover, collect, and trade unique digital assets
            </p>
          </div>
        </div>

        <FilterSort 
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <NFTGrid 
            nfts={filteredNfts} 
            loading={loading}
            onBuyNFT={handleBuyNFT}
            onMakeOffer={handleViewDetails}
          />
        )}
      </div>

      {/* NFT Details Modal */}
      <NFTDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        nft={selectedNFT}
        onBuyNFT={selectedNFT ? () => handleBuyNFT(selectedNFT) : undefined}
        onSuccess={loadNFTs}
      />
    </div>
  );
};

export default Marketplace;
