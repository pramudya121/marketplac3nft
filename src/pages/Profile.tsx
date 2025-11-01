import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NFTGrid } from "@/components/NFTGrid";
import { ListNFTModal } from "@/components/ListNFTModal";
import { TransferNFTModal } from "@/components/TransferNFTModal";
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
  const [transferModalOpen, setTransferModalOpen] = useState(false);
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

  const handleTransferNFT = (nft: any) => {
    setSelectedNFT(nft);
    setTransferModalOpen(true);
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
                label: (nft: any) => nft.listing ? "Listed" : "List NFT",
                onClick: (nft: any) => {
                  if (!nft.listing) {
                    handleListNFT(nft);
                  }
                },
                condition: (nft: any) => !nft.listing,
                secondaryAction: {
                  label: "Transfer",
                  onClick: handleTransferNFT
                }
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
              walletAddress={walletAddress}
            />
          </TabsContent>

          <TabsContent value="history">
            <TransactionHistory address={address || ""} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {selectedNFT && (
        <>
          <ListNFTModal
            open={listModalOpen}
            onOpenChange={setListModalOpen}
            nft={selectedNFT}
            onSuccess={loadProfileData}
          />
          <TransferNFTModal
            open={transferModalOpen}
            onOpenChange={setTransferModalOpen}
            nft={selectedNFT}
            onSuccess={loadProfileData}
          />
        </>
      )}
    </div>
  );
};

export default Profile;
