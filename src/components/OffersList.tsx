import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { acceptOffer, formatPrice } from "@/lib/web3";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface OffersListProps {
  address: string;
  isOwnProfile: boolean;
  onOfferAccepted?: () => void;
}

export const OffersList = ({ address, isOwnProfile, onOfferAccepted }: OffersListProps) => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingOffer, setAcceptingOffer] = useState<string | null>(null);

  useEffect(() => {
    loadOffers();
  }, [address]);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("offers")
        .select(`
          *,
          nfts!inner(*)
        `)
        .eq("nfts.owner_address", address.toLowerCase())
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error("Error loading offers:", error);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offer: any) => {
    setAcceptingOffer(offer.id);
    try {
      const success = await acceptOffer(offer.nfts.token_id);
      
      if (success) {
        // Update database
        await supabase
          .from("offers")
          .update({ active: false })
          .eq("id", offer.id);

        await supabase
          .from("nfts")
          .update({ owner_address: offer.offerer_address })
          .eq("id", offer.nft_id);

        await supabase.from("transactions").insert({
          nft_id: offer.nft_id,
          from_address: address.toLowerCase(),
          to_address: offer.offerer_address,
          price: formatPrice(offer.price),
          transaction_type: "offer_accepted",
        });

        toast.success("Offer accepted!");
        loadOffers();
        onOfferAccepted?.();
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      toast.error("Failed to accept offer");
    } finally {
      setAcceptingOffer(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No offers found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => (
        <Card key={offer.id} className="frost-glass border-white/20">
          <CardHeader>
            <img
              src={offer.nfts.image_url}
              alt={offer.nfts.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <CardTitle className="text-lg">{offer.nfts.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Offer Price</span>
              <Badge variant="secondary" className="text-base font-semibold">
                {formatPrice(offer.price)} HELIOS
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              From: {offer.offerer_address.substring(0, 6)}...
              {offer.offerer_address.substring(offer.offerer_address.length - 4)}
            </div>
            {isOwnProfile && (
              <Button
                onClick={() => handleAcceptOffer(offer)}
                disabled={acceptingOffer === offer.id}
                className="w-full sakura-gradient"
              >
                {acceptingOffer === offer.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Offer"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
