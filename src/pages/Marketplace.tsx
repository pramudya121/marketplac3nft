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
import { AIChat } from "@/components/AIChat";
import { AdvancedFilters } from "@/components/AdvancedFilters";
import { TrendingNFTs } from "@/components/TrendingNFTs";
import { MarketplaceStats } from "@/components/MarketplaceStats";

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
  const [userAddress, setUserAddress] = useState<string>("");
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    searchQuery: "",
    hasOffers: false,
    isActive: true
  });

  useEffect(() => {
    loadNFTs();
    getUserAddress();
  }, []);

  const getUserAddress = async () => {
    try {
      const signer = await getSigner();
      if (signer) {
        const address = await signer.getAddress();
        setUserAddress(address);
      }
    } catch (error) {
      console.error("Error getting user address:", error);
    }
  };

  useEffect(() => {
    applyFiltersAndSort();
  }, [nfts, sortBy, filters]);

  const applyFiltersAndSort = async () => {
    // Only show NFTs with active listings in marketplace
    let filtered = nfts.filter(nft => filters.isActive ? nft.listing?.active : true);

    // Apply search filter
    if (filters.searchQuery) {
      filtered = filtered.filter(nft =>
        nft.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        nft.description?.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    // Apply price filters
    if (filters.minPrice) {
      filtered = filtered.filter(nft =>
        nft.listing && parseFloat(nft.listing.price) >= parseFloat(filters.minPrice)
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(nft =>
        nft.listing && parseFloat(nft.listing.price) <= parseFloat(filters.maxPrice)
      );
    }

    // Apply offers filter
    if (filters.hasOffers) {
      const nftsWithOffers = new Set<string>();
      const { data: offersData } = await supabase
        .from("offers")
        .select("nft_id")
        .eq("active", true);
      
      offersData?.forEach(offer => nftsWithOffers.add(offer.nft_id));
      filtered = filtered.filter(nft => nftsWithOffers.has(nft.id));
    }

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
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link to="/collections">
              <Button variant="ghost">Collections</Button>
            </Link>
            <Link to="/analytics">
              <Button variant="ghost">Analytics</Button>
            </Link>
            <Link to="/watchlist">
              <Button variant="ghost">Watchlist</Button>
            </Link>
            <WalletConnect />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold mb-3">
              <span className="text-gradient">Explore NFTs</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover, collect, and trade unique digital assets on Helios
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <MarketplaceStats />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex gap-4 items-center">
              <FilterSort 
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
              <AdvancedFilters onFilterChange={setFilters} />
            </div>

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
                userAddress={userAddress}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <TrendingNFTs />
          </div>
        </div>
      </div>

      {/* AI Chat Assistant */}
      <AIChat />

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
