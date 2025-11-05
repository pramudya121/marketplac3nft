import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, Search, TrendingUp, Eye } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";
import { SakuraAnimation } from "@/components/SakuraAnimation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import heroImage from "@/assets/hero-sakura.jpg";

interface Collection {
  owner_address: string;
  nft_count: number;
  total_volume: number;
  floor_price: number;
  listed_count: number;
}

const Collections = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    try {
      // Get all NFTs with their listings
      const { data: nftsData, error } = await supabase
        .from("nfts")
        .select(`
          owner_address,
          listings:listings(price, active)
        `);

      if (error) throw error;

      // Group by owner and calculate stats
      const collectionsMap = new Map<string, Collection>();
      
      nftsData?.forEach((nft) => {
        const owner = nft.owner_address.toLowerCase();
        const existing = collectionsMap.get(owner);
        const activeListing = nft.listings?.find((l: any) => l.active);
        const price = activeListing ? parseFloat(activeListing.price) : 0;

        if (existing) {
          existing.nft_count++;
          existing.total_volume += price;
          if (activeListing) {
            existing.listed_count++;
            if (price < existing.floor_price || existing.floor_price === 0) {
              existing.floor_price = price;
            }
          }
        } else {
          collectionsMap.set(owner, {
            owner_address: owner,
            nft_count: 1,
            total_volume: price,
            floor_price: activeListing ? price : 0,
            listed_count: activeListing ? 1 : 0,
          });
        }
      });

      const collectionsArray = Array.from(collectionsMap.values())
        .filter(c => c.nft_count > 0)
        .sort((a, b) => b.nft_count - a.nft_count);

      setCollections(collectionsArray);
    } catch (error) {
      console.error("Error loading collections:", error);
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const filteredCollections = collections.filter((collection) =>
    collection.owner_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

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
          <h1 className="text-5xl font-bold mb-4 text-gradient animate-float">
            NFT Collections
          </h1>
          <p className="text-xl text-foreground/80">
            Explore collections from top creators and collectors
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by wallet address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 frost-glass"
            />
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="glass-card animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredCollections.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">No collections found</p>
            </div>
          ) : (
            filteredCollections.map((collection, index) => (
              <Card
                key={collection.owner_address}
                className="glass-card card-hover cursor-pointer transition-all"
                onClick={() => navigate(`/profile/${collection.owner_address}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">
                        {formatAddress(collection.owner_address)}
                      </CardTitle>
                      <CardDescription>
                        Collection #{index + 1}
                      </CardDescription>
                    </div>
                    {index < 3 && (
                      <div className="sakura-gradient px-3 py-1 rounded-full text-xs text-white font-semibold">
                        Top {index + 1}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total NFTs</span>
                      <span className="font-semibold flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        {collection.nft_count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Listed</span>
                      <span className="font-semibold">{collection.listed_count}</span>
                    </div>
                    {collection.floor_price > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Floor Price</span>
                        <span className="font-semibold text-primary">
                          {collection.floor_price.toFixed(2)} HELIOS
                        </span>
                      </div>
                    )}
                    <Button
                      className="w-full mt-4"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${collection.owner_address}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Collection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Collections;
