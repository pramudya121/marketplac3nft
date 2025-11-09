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
import { FilterSort } from "@/components/FilterSort";

interface Collection {
  owner_address: string;
  nft_count: number;
  total_volume: number;
  floor_price: number;
  listed_count: number;
  volume_24h?: number;
  volume_7d?: number;
  volume_change_24h?: number;
  volume_change_7d?: number;
  is_verified?: boolean;
}

const Collections = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("nft_count");

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    try {
      // Get all NFTs with their listings and transactions
      const { data: nftsData, error } = await supabase
        .from("nfts")
        .select(`
          owner_address,
          id,
          listings:listings(price, active)
        `);

      if (error) throw error;

      // Get transactions for volume trends
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data: transactions24h } = await supabase
        .from("transactions")
        .select("to_address, price")
        .gte("created_at", oneDayAgo.toISOString());

      const { data: transactions7d } = await supabase
        .from("transactions")
        .select("to_address, price")
        .gte("created_at", sevenDaysAgo.toISOString());

      // Group by owner and calculate stats
      const collectionsMap = new Map<string, Collection>();
      
      nftsData?.forEach((nft) => {
        const owner = nft.owner_address.toLowerCase();
        const existing = collectionsMap.get(owner);
        const activeListing = nft.listings?.find((l: any) => l.active);
        const price = activeListing ? parseFloat(activeListing.price) : 0;
        const normalizedPrice = price > 1000000 ? price / 1e18 : price;

        if (existing) {
          existing.nft_count++;
          existing.total_volume += normalizedPrice;
          if (activeListing) {
            existing.listed_count++;
            if (normalizedPrice < existing.floor_price || existing.floor_price === 0) {
              existing.floor_price = normalizedPrice;
            }
          }
        } else {
          collectionsMap.set(owner, {
            owner_address: owner,
            nft_count: 1,
            total_volume: normalizedPrice,
            floor_price: activeListing ? normalizedPrice : 0,
            listed_count: activeListing ? 1 : 0,
            volume_24h: 0,
            volume_7d: 0,
            volume_change_24h: 0,
            volume_change_7d: 0,
            is_verified: false,
          });
        }
      });

      // Calculate volume trends
      transactions24h?.forEach((tx) => {
        const owner = tx.to_address.toLowerCase();
        const collection = collectionsMap.get(owner);
        if (collection) {
          const price = parseFloat(tx.price || "0");
          const normalizedPrice = price > 1000000 ? price / 1e18 : price;
          collection.volume_24h! += normalizedPrice;
        }
      });

      transactions7d?.forEach((tx) => {
        const owner = tx.to_address.toLowerCase();
        const collection = collectionsMap.get(owner);
        if (collection) {
          const price = parseFloat(tx.price || "0");
          const normalizedPrice = price > 1000000 ? price / 1e18 : price;
          collection.volume_7d! += normalizedPrice;
        }
      });

      // Calculate percentage changes and mark top collections as verified
      const collectionsArray = Array.from(collectionsMap.values())
        .filter(c => c.nft_count > 0)
        .sort((a, b) => b.nft_count - a.nft_count)
        .map((collection, index) => {
          const prevVolume24h = collection.total_volume - (collection.volume_24h || 0);
          const prevVolume7d = collection.total_volume - (collection.volume_7d || 0);
          
          collection.volume_change_24h = prevVolume24h > 0 
            ? ((collection.volume_24h || 0) / prevVolume24h) * 100 
            : 0;
          
          collection.volume_change_7d = prevVolume7d > 0 
            ? ((collection.volume_7d || 0) / prevVolume7d) * 100 
            : 0;

          // Mark top 10 collections as verified
          collection.is_verified = index < 10 && collection.nft_count >= 3;

          return collection;
        });

      setCollections(collectionsArray);
    } catch (error) {
      console.error("Error loading collections:", error);
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedCollections = collections
    .filter((collection) =>
      collection.owner_address.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "floor_price_low":
          return (a.floor_price || Infinity) - (b.floor_price || Infinity);
        case "floor_price_high":
          return (b.floor_price || 0) - (a.floor_price || 0);
        case "volume_low":
          return a.total_volume - b.total_volume;
        case "volume_high":
          return b.total_volume - a.total_volume;
        case "nft_count":
        default:
          return b.nft_count - a.nft_count;
      }
    });

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

        {/* Search and Sort */}
        <div className="max-w-4xl mx-auto mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by wallet address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 frost-glass"
            />
          </div>
          <FilterSort
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
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
          ) : filteredAndSortedCollections.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">No collections found</p>
            </div>
          ) : (
            filteredAndSortedCollections.map((collection, index) => (
              <Card
                key={collection.owner_address}
                className="glass-card card-hover cursor-pointer transition-all"
                onClick={() => navigate(`/profile/${collection.owner_address}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">
                          {formatAddress(collection.owner_address)}
                        </CardTitle>
                        {collection.is_verified && (
                          <div className="sakura-gradient px-2 py-0.5 rounded-full">
                            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
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
                    
                    {/* Volume Trends */}
                    {(collection.volume_24h! > 0 || collection.volume_7d! > 0) && (
                      <div className="pt-2 border-t border-border/50 space-y-2">
                        {collection.volume_24h! > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">24h Volume</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{collection.volume_24h!.toFixed(2)} HELIOS</span>
                              {collection.volume_change_24h! !== 0 && (
                                <span className={collection.volume_change_24h! > 0 ? "text-green-500" : "text-red-500"}>
                                  {collection.volume_change_24h! > 0 ? "↑" : "↓"}
                                  {Math.abs(collection.volume_change_24h!).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {collection.volume_7d! > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">7d Volume</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{collection.volume_7d!.toFixed(2)} HELIOS</span>
                              {collection.volume_change_7d! !== 0 && (
                                <span className={collection.volume_change_7d! > 0 ? "text-green-500" : "text-red-500"}>
                                  {collection.volume_change_7d! > 0 ? "↑" : "↓"}
                                  {Math.abs(collection.volume_change_7d!).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        )}
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
