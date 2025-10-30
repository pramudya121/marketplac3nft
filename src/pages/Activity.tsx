import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletConnect } from "@/components/WalletConnect";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { SakuraAnimation } from "@/components/SakuraAnimation";

interface Transaction {
  id: string;
  nft_id: string;
  from_address: string;
  to_address: string;
  price: string | null;
  transaction_type: string;
  transaction_hash: string | null;
  created_at: string;
  nfts: {
    name: string;
    image_url: string;
  };
}

const Activity = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          nfts (
            name,
            image_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "mint":
        return "🎨";
      case "sale":
        return "💰";
      case "transfer":
        return "📤";
      case "list":
        return "🏷️";
      default:
        return "📝";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
        <h1 className="text-4xl font-bold mb-2">Activity</h1>
        <p className="text-muted-foreground mb-8">
          Real-time marketplace activity and transactions
        </p>

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No activity yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <Card key={tx.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  {/* NFT Image */}
                  <img
                    src={tx.nfts.image_url}
                    alt={tx.nfts.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />

                  {/* Transaction Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{getTransactionIcon(tx.transaction_type)}</span>
                      <h3 className="font-semibold">{tx.nfts.name}</h3>
                      <Badge variant="outline" className="capitalize">
                        {tx.transaction_type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>From: {formatAddress(tx.from_address)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowDownRight className="w-4 h-4" />
                        <span>To: {formatAddress(tx.to_address)}</span>
                      </div>
                      {tx.price && (
                        <span className="font-semibold text-primary">
                          {parseFloat(tx.price).toFixed(4)} HLS
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Transaction Hash */}
                  {tx.transaction_hash && (
                    <a
                      href={`https://testnet.helioscan.io/tx/${tx.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      View on Explorer →
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
