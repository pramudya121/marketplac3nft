import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "./ui/card";
import { TrendingUp, DollarSign, ShoppingCart, Activity } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface Stats {
  totalNFTs: number;
  totalListings: number;
  totalVolume: string;
  activeOffers: number;
}

export function MarketplaceStats() {
  const [stats, setStats] = useState<Stats>({
    totalNFTs: 0,
    totalListings: 0,
    totalVolume: "0",
    activeOffers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [nftsData, listingsData, transactionsData, offersData] = await Promise.all([
        supabase.from("nfts").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("transactions").select("price"),
        supabase.from("offers").select("id", { count: "exact", head: true }).eq("active", true)
      ]);

      const totalVolume = (transactionsData.data || [])
        .reduce((sum, t) => sum + parseFloat(t.price || "0"), 0)
        .toFixed(2);

      setStats({
        totalNFTs: nftsData.count || 0,
        totalListings: listingsData.count || 0,
        totalVolume,
        activeOffers: offersData.count || 0
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statItems = [
    {
      icon: Activity,
      label: "Total NFTs",
      value: stats.totalNFTs.toLocaleString(),
      color: "text-blue-500"
    },
    {
      icon: ShoppingCart,
      label: "Active Listings",
      value: stats.totalListings.toLocaleString(),
      color: "text-green-500"
    },
    {
      icon: DollarSign,
      label: "Total Volume",
      value: `${stats.totalVolume} HLS`,
      color: "text-purple-500"
    },
    {
      icon: TrendingUp,
      label: "Active Offers",
      value: stats.activeOffers.toLocaleString(),
      color: "text-orange-500"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, idx) => (
        <Card key={idx} className="border-border/50 hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <p className="text-2xl font-bold mb-1">{item.value}</p>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}