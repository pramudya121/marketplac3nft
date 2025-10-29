import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { acceptOffer, cancelOffer, formatPrice } from "@/lib/web3";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

interface OffersListProps {
  address: string;
  isOwnProfile: boolean;
  onOfferAccepted?: () => void;
  walletAddress?: string | null;
}

export const OffersList = ({ address, isOwnProfile, onOfferAccepted, walletAddress }: OffersListProps) => {
  const [receivedOffers, setReceivedOffers] = useState<any[]>([]);
  const [madeOffers, setMadeOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingOffer, setAcceptingOffer] = useState<string | null>(null);
  const [cancellingOffer, setCancellingOffer] = useState<string | null>(null);

  useEffect(() => {
    loadOffers();
  }, [address]);

  const loadOffers = async () => {
    setLoading(true);
    try {
      // Load offers received (on NFTs owned by this address)
      const { data: received, error: receivedError } = await supabase
        .from("offers")
        .select(`
          *,
          nfts!inner(*)
        `)
        .eq("nfts.owner_address", address.toLowerCase())
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (receivedError) throw receivedError;
      setReceivedOffers(received || []);

      // Load offers made by this address
      const { data: made, error: madeError } = await supabase
        .from("offers")
        .select(`
          *,
          nfts(*)
        `)
        .eq("offerer_address", address.toLowerCase())
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (madeError) throw madeError;
      setMadeOffers(made || []);
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

  const handleCancelOffer = async (offer: any) => {
    setCancellingOffer(offer.id);
    try {
      const success = await cancelOffer(offer.nfts.token_id);
      
      if (success) {
        await supabase
          .from("offers")
          .update({ active: false })
          .eq("id", offer.id);

        toast.success("Offer cancelled!");
        loadOffers();
      }
    } catch (error) {
      console.error("Error cancelling offer:", error);
      toast.error("Failed to cancel offer");
    } finally {
      setCancellingOffer(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasReceivedOffers = receivedOffers.length > 0;
  const hasMadeOffers = madeOffers.length > 0;

  if (!hasReceivedOffers && !hasMadeOffers) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No offers found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Received Offers */}
      {hasReceivedOffers && (
        <div>
          <h3 className="text-xl font-bold mb-4">Offers Received</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {receivedOffers.map((offer) => (
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
        </div>
      )}

      {/* Made Offers */}
      {hasMadeOffers && (
        <div>
          <h3 className="text-xl font-bold mb-4">Offers Made</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {madeOffers.map((offer) => (
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
                    <span className="text-sm text-muted-foreground">Your Offer</span>
                    <Badge variant="secondary" className="text-base font-semibold">
                      {formatPrice(offer.price)} HELIOS
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    To: {offer.nfts.owner_address.substring(0, 6)}...
                    {offer.nfts.owner_address.substring(offer.nfts.owner_address.length - 4)}
                  </div>
                  {isOwnProfile && (
                    <Button
                      onClick={() => handleCancelOffer(offer)}
                      disabled={cancellingOffer === offer.id}
                      variant="destructive"
                      className="w-full"
                    >
                      {cancellingOffer === offer.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Cancel Offer
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
