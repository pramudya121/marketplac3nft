import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "./ui/card";
import { TrendingUp, Flame } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface TrendingNFT {
  id: string;
  name: string;
  image_url: string;
  offer_count: number;
  transaction_count: number;
}

export function TrendingNFTs() {
  const [trending, setTrending] = useState<TrendingNFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      const { data, error } = await supabase
        .from("trending_nfts")
        .select("id, name, image_url, offer_count, transaction_count")
        .limit(5);

      if (error) throw error;
      setTrending(data || []);
    } catch (error) {
      console.error("Error loading trending NFTs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (trending.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Trending NFTs</h3>
        </div>
        <div className="space-y-3">
          {trending.map((nft, idx) => (
            <div
              key={nft.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <span className="text-2xl font-bold text-muted-foreground w-8">
                #{idx + 1}
              </span>
              <img
                src={nft.image_url}
                alt={nft.name}
                className="w-12 h-12 rounded-md object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{nft.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{nft.offer_count} offers</span>
                  <span>•</span>
                  <span>{nft.transaction_count} sales</span>
                </div>
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}