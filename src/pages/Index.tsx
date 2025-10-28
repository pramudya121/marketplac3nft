import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Plus, Search } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";
import { SakuraAnimation } from "@/components/SakuraAnimation";
import { NFTGrid } from "@/components/NFTGrid";
import { MintNFTModal } from "@/components/MintNFTModal";
import { supabase } from "@/integrations/supabase/client";
import { buyNFT, makeOffer, formatPrice } from "@/lib/web3";
import { toast } from "sonner";
import heroImage from "@/assets/hero-sakura.jpg";

const Index = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Check wallet connection
    const checkWallet = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      }
    };
    checkWallet();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setWalletAddress(accounts.length > 0 ? accounts[0] : null);
      });
    }

    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    setLoading(true);
    try {
      const { data: nftsData, error } = await supabase
        .from("nfts")
        .select(`
          *,
          listings:listings(listing_id, price, active)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to include listing info
      const transformedNFTs = nftsData?.map((nft) => ({
        ...nft,
        listing: nft.listings?.[0] || null,
      })) || [];

      setNfts(transformedNFTs);
    } catch (error) {
      console.error("Error loading NFTs:", error);
      toast.error("Failed to load NFTs");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNFT = async (nft: any) => {
    if (!walletAddress) {
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
      // Update database
      await supabase
        .from("listings")
        .update({ active: false })
        .eq("listing_id", nft.listing.listing_id);

      await supabase
        .from("nfts")
        .update({ owner_address: walletAddress })
        .eq("id", nft.id);

      await supabase.from("transactions").insert({
        nft_id: nft.id,
        from_address: nft.owner_address,
        to_address: walletAddress,
        price: priceInHelios,
        transaction_type: "sale",
      });

      loadNFTs();
    }
  };

  const handleMakeOffer = async (nft: any) => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    const offerPrice = prompt("Enter your offer price in HELIOS:");
    if (!offerPrice) return;

    const success = await makeOffer(nft.token_id, offerPrice);
    
    if (success) {
      await supabase.from("offers").insert({
        nft_id: nft.id,
        offerer_address: walletAddress,
        price: offerPrice,
        active: true,
      });
      
      toast.success("Offer submitted!");
    }
  };

  const filteredNFTs = nfts.filter((nft) =>
    nft.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <img
          src={heroImage}
          alt="Sakura Winter"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 hero-gradient opacity-60" />
      </div>

      <SakuraAnimation />

      {/* Header */}
      <header className="sticky top-0 z-50 frost-glass border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary animate-float" />
              <h1 className="text-2xl font-bold text-gradient">
                Sakura Frost Market
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {walletAddress && (
                <Button
                  onClick={() => setMintModalOpen(true)}
                  className="sakura-gradient font-semibold shadow-md"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Mint NFT
                </Button>
              )}
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 py-12">
          <h2 className="text-5xl md:text-6xl font-bold mb-4 text-gradient animate-float">
            Winter Blossom NFTs
          </h2>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Discover, mint, and trade unique NFTs on Helios blockchain
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search NFTs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 frost-glass"
            />
          </div>
        </div>

        {/* NFT Grid */}
        <NFTGrid
          nfts={filteredNFTs}
          loading={loading}
          onBuyNFT={handleBuyNFT}
          onMakeOffer={handleMakeOffer}
        />
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 mt-16 border-t border-white/20 frost-glass">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by Helios Blockchain • Made with 🌸 and ❄️
          </p>
        </div>
      </footer>

      {/* Mint Modal */}
      <MintNFTModal
        open={mintModalOpen}
        onOpenChange={setMintModalOpen}
        onSuccess={loadNFTs}
        walletAddress={walletAddress || undefined}
      />
    </div>
  );
};

export default Index;
