import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NFTGrid } from "@/components/NFTGrid";
import { ListNFTModal } from "@/components/ListNFTModal";
import { OffersList } from "@/components/OffersList";
import { TransactionHistory } from "@/components/TransactionHistory";
import { SakuraAnimation } from "@/components/SakuraAnimation";
import { WalletConnect } from "@/components/WalletConnect";
import heroImage from "@/assets/hero-sakura.jpg";

const Profile = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ownedNFTs, setOwnedNFTs] = useState<any[]>([]);
  const [listedNFTs, setListedNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);

  const isOwnProfile = walletAddress?.toLowerCase() === address?.toLowerCase();

  useEffect(() => {
    const checkWallet = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      }
    };
    checkWallet();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setWalletAddress(accounts.length > 0 ? accounts[0] : null);
      });
    }

    loadProfileData();
  }, [address]);

  const loadProfileData = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // Load owned NFTs
      const { data: ownedData, error: ownedError } = await supabase
        .from("nfts")
        .select(`
          *,
          listings:listings(listing_id, price, active)
        `)
        .eq("owner_address", address.toLowerCase())
        .order("created_at", { ascending: false });

      if (ownedError) throw ownedError;

      const transformedOwned = ownedData?.map((nft) => ({
        ...nft,
        listing: nft.listings?.find((l: any) => l.active) || null,
      })) || [];

      setOwnedNFTs(transformedOwned);

      // Load listed NFTs
      const { data: listedData, error: listedError } = await supabase
        .from("nfts")
        .select(`
          *,
          listings!inner(listing_id, price, active, seller_address)
        `)
        .eq("listings.seller_address", address.toLowerCase())
        .eq("listings.active", true)
        .order("created_at", { ascending: false });

      if (listedError) throw listedError;

      const transformedListed = listedData?.map((nft) => ({
        ...nft,
        listing: nft.listings?.[0] || null,
      })) || [];

      setListedNFTs(transformedListed);
    } catch (error) {
      console.error("Error loading profile data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleListNFT = (nft: any) => {
    setSelectedNFT(nft);
    setListModalOpen(true);
  };

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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Sparkles className="h-8 w-8 text-primary animate-float" />
              <h1 className="text-2xl font-bold text-gradient">
                Profile
              </h1>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent mb-4 shadow-glow">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gradient mb-2">
            {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
          </h2>
          {isOwnProfile && (
            <p className="text-sm text-muted-foreground">Your Profile</p>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="owned" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="owned">Owned</TabsTrigger>
            <TabsTrigger value="listed">Listed</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="owned">
            <NFTGrid
              nfts={ownedNFTs}
              loading={loading}
              onBuyNFT={() => {}}
              onMakeOffer={() => {}}
              showActions={false}
              customAction={isOwnProfile ? {
                label: "List NFT",
                onClick: handleListNFT,
                condition: (nft) => !nft.listing
              } : undefined}
            />
          </TabsContent>

          <TabsContent value="listed">
            <NFTGrid
              nfts={listedNFTs}
              loading={loading}
              onBuyNFT={() => {}}
              onMakeOffer={() => {}}
              showActions={false}
            />
          </TabsContent>

          <TabsContent value="offers">
            <OffersList
              address={address || ""}
              isOwnProfile={isOwnProfile}
              onOfferAccepted={loadProfileData}
            />
          </TabsContent>

          <TabsContent value="history">
            <TransactionHistory address={address || ""} />
          </TabsContent>
        </Tabs>
      </main>

      {/* List Modal */}
      {selectedNFT && (
        <ListNFTModal
          open={listModalOpen}
          onOpenChange={setListModalOpen}
          nft={selectedNFT}
          onSuccess={loadProfileData}
        />
      )}
    </div>
  );
};

export default Profile;
