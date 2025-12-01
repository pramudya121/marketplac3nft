import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  } | null;
}

interface ActivityFeedProps {
  limit?: number;
  showTitle?: boolean;
}

export function ActivityFeed({ limit = 10, showTitle = true }: ActivityFeedProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions'
        },
        async (payload) => {
          // Fetch the complete transaction with NFT data
          const { data, error } = await supabase
            .from('transactions')
            .select(`
              *,
              nfts (
                name,
                image_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data && data.nfts) {
            setTransactions(prev => [data as Transaction, ...prev.slice(0, limit - 1)]);
            
            // Show toast notification for new activity
            toast.success(`New ${data.transaction_type}: ${data.nfts.name}`, {
              description: `${formatAddress(data.from_address)} → ${formatAddress(data.to_address)}`
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

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
        .limit(limit);

      if (error) throw error;
      const validTransactions = (data || []).filter(tx => tx.nfts !== null);
      setTransactions(validTransactions as Transaction[]);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {showTitle && (
        <h2 className="text-2xl font-bold mb-4">Live Activity Feed</h2>
      )}
      
      {transactions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No activity yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Card key={tx.id} className="p-3 hover:shadow-md transition-all duration-300 card-hover">
              <div className="flex items-center gap-3">
                <img
                  src={tx.nfts!.image_url}
                  alt={tx.nfts!.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{getTransactionIcon(tx.transaction_type)}</span>
                    <h3 className="font-semibold truncate">{tx.nfts!.name}</h3>
                    <Badge variant="outline" className="capitalize text-xs">
                      {tx.transaction_type}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>{formatAddress(tx.from_address)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3" />
                      <span>{formatAddress(tx.to_address)}</span>
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

                {tx.transaction_hash && (
                  <a
                    href={`https://testnet.helioscan.io/tx/${tx.transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs whitespace-nowrap"
                  >
                    View →
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
