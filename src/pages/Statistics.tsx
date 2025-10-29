import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft, TrendingUp, Package, Users, DollarSign } from "lucide-react";
import { SakuraAnimation } from "@/components/SakuraAnimation";
import { WalletConnect } from "@/components/WalletConnect";
import { supabase } from "@/integrations/supabase/client";
import {
  getTotalMinted,
  getListingCount,
  getMarketplaceFee,
  getFeeRecipient,
  getNFTName,
  getNFTSymbol,
} from "@/lib/web3";
import { Skeleton } from "@/components/ui/skeleton";
import heroImage from "@/assets/hero-sakura.jpg";

const Statistics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMinted: 0,
    totalListed: 0,
    totalSales: 0,
    totalVolume: "0",
    marketplaceFee: 0,
    feeRecipient: "",
    collectionName: "",
    collectionSymbol: "",
    uniqueOwners: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      // Load blockchain data
      const [minted, listed, fee, recipient, name, symbol] = await Promise.all([
        getTotalMinted(),
        getListingCount(),
        getMarketplaceFee(),
        getFeeRecipient(),
        getNFTName(),
        getNFTSymbol(),
      ]);

      // Load database stats
      const { data: transactions } = await supabase
        .from("transactions")
        .select("price, transaction_type")
        .eq("transaction_type", "sale");

      const { data: nfts } = await supabase
        .from("nfts")
        .select("owner_address");

      const totalVolume = transactions?.reduce((sum, tx) => {
        return sum + parseFloat(tx.price || "0");
      }, 0) || 0;

      const uniqueOwners = new Set(nfts?.map((nft) => nft.owner_address)).size;

      setStats({
        totalMinted: minted,
        totalListed: listed,
        totalSales: transactions?.length || 0,
        totalVolume: totalVolume.toFixed(4),
        marketplaceFee: fee / 100, // Convert from basis points
        feeRecipient: recipient,
        collectionName: name,
        collectionSymbol: symbol,
        uniqueOwners,
      });
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, suffix = "" }: any) => (
    <Card className="frost-glass border-white/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">
            {value} {suffix}
          </div>
        )}
      </CardContent>
    </Card>
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
                Marketplace Statistics
              </h1>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Collection Info */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gradient mb-2">
            {loading ? <Skeleton className="h-10 w-64 mx-auto" /> : stats.collectionName}
          </h2>
          <p className="text-muted-foreground">
            {loading ? <Skeleton className="h-4 w-32 mx-auto" /> : `Symbol: ${stats.collectionSymbol}`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Minted"
            value={stats.totalMinted}
            icon={Package}
            suffix="NFTs"
          />
          <StatCard
            title="Total Listed"
            value={stats.totalListed}
            icon={TrendingUp}
            suffix="NFTs"
          />
          <StatCard
            title="Total Sales"
            value={stats.totalSales}
            icon={DollarSign}
            suffix="Sales"
          />
          <StatCard
            title="Unique Owners"
            value={stats.uniqueOwners}
            icon={Users}
            suffix="Owners"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="frost-glass border-white/20">
            <CardHeader>
              <CardTitle>Trading Volume</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-12 w-32" />
              ) : (
                <div className="text-4xl font-bold text-gradient">
                  {stats.totalVolume} HELIOS
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="frost-glass border-white/20">
            <CardHeader>
              <CardTitle>Marketplace Fee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-full" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-gradient">
                    {stats.marketplaceFee}%
                  </div>
                  <p className="text-xs text-muted-foreground break-all">
                    Recipient: {stats.feeRecipient.substring(0, 6)}...
                    {stats.feeRecipient.substring(stats.feeRecipient.length - 4)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Statistics;
