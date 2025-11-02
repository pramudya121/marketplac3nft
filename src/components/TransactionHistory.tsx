import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface TransactionHistoryProps {
  address: string;
}

export const TransactionHistory = ({ address }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [address]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          nfts(name, image_url)
        `)
        .or(`from_address.eq.${address.toLowerCase()},to_address.eq.${address.toLowerCase()}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  };

  const getTransactionType = (tx: any) => {
    if (tx.from_address.toLowerCase() === address.toLowerCase()) {
      return { label: "Sold", variant: "destructive" as const };
    }
    return { label: "Bought", variant: "default" as const };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No transaction history</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx) => {
        const txType = getTransactionType(tx);
        return (
          <Card key={tx.id} className="frost-glass border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <img
                  src={tx.nfts.image_url}
                  alt={tx.nfts.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{tx.nfts.name}</h3>
                    <Badge variant={txType.variant}>{txType.label}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {tx.from_address.substring(0, 6)}...
                      {tx.from_address.substring(tx.from_address.length - 4)}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                    <span>
                      {tx.to_address.substring(0, 6)}...
                      {tx.to_address.substring(tx.to_address.length - 4)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(tx.created_at), "PPp")}
                  </p>
                </div>
                {tx.price && (
                  <div className="text-right">
                    <p className="font-semibold text-lg">{parseFloat(tx.price).toFixed(4)} HLS</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {tx.transaction_type.replace("_", " ")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
