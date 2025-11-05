import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Heart, Search } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";
import { SakuraAnimation } from "@/components/SakuraAnimation";
import { NFTGrid } from "@/components/NFTGrid";
import { supabase } from "@/integrations/supabase/client";
import { buyNFT, makeOffer, formatPrice, getSigner } from "@/lib/web3";
import { toast } from "sonner";
import heroImage from "@/assets/hero-sakura.jpg";

const Watchlist = () => {
  const navigate = useNavigate();
  const [userAddress, setUserAddress] = useState<string>("");
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getUserAddress();
  }, []);

  useEffect(() => {
    if (userAddress) {
      loadFavorites();
    }
  }, [userAddress]);

  const getUserAddress = async () => {
    try {
      const signer = await getSigner();
      const address = await signer.getAddress();
      setUserAddress(address.toLowerCase());
    } catch (error) {
      console.error("Error getting user address:", error);
    }
  };

  const loadFavorites = async () => {
    if (!userAddress) return;
    
    setLoading(true);
    try {
      const { data: favoritesData, error } = await supabase
        .from("favorites")
        .select(`
          nft_id,
          nfts:nft_id (
            *,
            listings:listings(listing_id, price, active)
          )
        `)
        .eq("user_address", userAddress);

      if (error) throw error;

      const transformedNFTs = favoritesData
        ?.map((fav) => {
          if (!fav.nfts) return null;
          return {
            ...fav.nfts,
            listing: fav.nfts.listings?.[0] || null,
          };
        })
        .filter(Boolean) || [];

      setFavorites(transformedNFTs);
    } catch (error) {
      console.error("Error loading favorites:", error);
      toast.error("Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNFT = async (nft: any) => {
    if (!userAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!nft.listing) {
      toast.error("This NFT is not listed for sale");
      return;
    }

    const priceInHelios = formatPrice(nft.listing.price);
    const success = await buyNFT(nft.listing.listing_id, priceInHelios);
    
    if (success) {
      await supabase
        .from("listings")
        .update({ active: false })
        .eq("listing_id", nft.listing.listing_id);

      await supabase
        .from("nfts")
        .update({ owner_address: userAddress })
        .eq("id", nft.id);

      await supabase.from("transactions").insert({
        nft_id: nft.id,
        from_address: nft.owner_address,
        to_address: userAddress,
        price: priceInHelios,
        transaction_type: "sale",
      });

      loadFavorites();
    }
  };

  const handleMakeOffer = async (nft: any) => {
    if (!userAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    const offerPrice = prompt("Enter your offer price in HELIOS:");
    if (!offerPrice) return;

    const success = await makeOffer(nft.token_id, offerPrice);
    
    if (success) {
      await supabase.from("offers").insert({
        nft_id: nft.id,
        offerer_address: userAddress,
        price: offerPrice,
        active: true,
      });
      
      toast.success("Offer submitted!");
    }
  };

  const filteredFavorites = favorites.filter((nft) =>
    nft.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <img
          src={heroImage}
          alt="Background"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 hero-gradient opacity-60" />
      </div>

      <SakuraAnimation />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 frost-glass border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary animate-float" />
              <h1 className="text-2xl font-bold text-gradient">Helios NFT</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/")}>
                Home
              </Button>
              <Button variant="ghost" onClick={() => navigate("/marketplace")}>
                Marketplace
              </Button>
              <Button variant="ghost" onClick={() => navigate("/collections")}>
                Collections
              </Button>
              <Button variant="ghost" onClick={() => navigate("/analytics")}>
                Analytics
              </Button>
              <Button variant="ghost" onClick={() => navigate("/watchlist")}>
                Watchlist
              </Button>
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-12 w-12 text-primary fill-primary animate-float" />
            <h1 className="text-5xl font-bold text-gradient">My Watchlist</h1>
          </div>
          <p className="text-xl text-foreground/80">
            Your favorite NFTs in one place
          </p>
        </div>

        {!userAddress ? (
          <div className="text-center py-20">
            <div className="glass-card max-w-md mx-auto p-8">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-bold mb-4">Connect Your Wallet</h3>
              <p className="text-muted-foreground mb-6">
                Please connect your wallet to view your watchlist
              </p>
              <WalletConnect />
            </div>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search your watchlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 frost-glass"
                />
              </div>
            </div>

            {/* NFT Grid */}
            {!loading && favorites.length === 0 ? (
              <div className="text-center py-20">
                <div className="glass-card max-w-md mx-auto p-8">
                  <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-bold mb-4">No Favorites Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start adding NFTs to your watchlist by clicking the heart icon on any NFT
                  </p>
                  <Button
                    className="sakura-gradient"
                    onClick={() => navigate("/marketplace")}
                  >
                    Browse Marketplace
                  </Button>
                </div>
              </div>
            ) : (
              <NFTGrid
                nfts={filteredFavorites}
                loading={loading}
                onBuyNFT={handleBuyNFT}
                onMakeOffer={handleMakeOffer}
                userAddress={userAddress}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Watchlist;
