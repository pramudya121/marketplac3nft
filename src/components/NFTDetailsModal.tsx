import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { makeOffer, cancelOffer, acceptOffer, getSigner } from "@/lib/web3";
import { toast } from "sonner";
import { Loader2, Tag, User, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/web3";

interface Offer {
  id: string;
  price: string;
  offerer_address: string;
  active: boolean;
  created_at: string;
}

interface NFTDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: {
    id: string;
    token_id: number;
    name: string;
    description?: string;
    image_url: string;
    owner_address: string;
    listing?: {
      listing_id: number;
      price: string;
      active: boolean;
    };
  } | null;
  onBuyNFT?: () => void;
  onSuccess?: () => void;
}

export const NFTDetailsModal = ({
  open,
  onOpenChange,
  nft,
  onBuyNFT,
  onSuccess,
}: NFTDetailsModalProps) => {
  const [offerPrice, setOfferPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [cancellingOffer, setCancellingOffer] = useState<string | null>(null);
  const [acceptingOffer, setAcceptingOffer] = useState<string | null>(null);

  useEffect(() => {
    if (open && nft) {
      loadOffers();
      loadUserAddress();
    }
  }, [open, nft]);

  const loadUserAddress = async () => {
    try {
      const signer = await getSigner();
      if (signer) {
        const address = await signer.getAddress();
        setUserAddress(address.toLowerCase());
      }
    } catch (error) {
      console.error("Error loading user address:", error);
    }
  };

  const loadOffers = async () => {
    if (!nft) return;
    
    setLoadingOffers(true);
    try {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("nft_id", nft.id)
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error("Error loading offers:", error);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!nft || !offerPrice) {
      toast.error("Please enter an offer price");
      return;
    }

    if (parseFloat(offerPrice) <= 0) {
      toast.error("Offer price must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const success = await makeOffer(nft.token_id, offerPrice);
      
      if (success) {
        const signer = await getSigner();
        const offererAddress = await signer?.getAddress();

        // Convert price to Wei for database (to match blockchain state)
        const priceInWei = (parseFloat(offerPrice) * 1e18).toString();

        await supabase.from("offers").insert({
          nft_id: nft.id,
          offerer_address: offererAddress?.toLowerCase(),
          price: priceInWei,
          active: true,
        });

        // Record transaction in HLS for easy reading
        await supabase.from("transactions").insert({
          nft_id: nft.id,
          from_address: offererAddress?.toLowerCase() || "",
          to_address: nft.owner_address,
          transaction_type: "offer",
          price: offerPrice,
        });

        toast.success("Offer made successfully!");
        setOfferPrice("");
        loadOffers();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error making offer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOffer = async (offerId: string, tokenId: number) => {
    setCancellingOffer(offerId);
    try {
      const success = await cancelOffer(tokenId);
      
      if (success) {
        await supabase
          .from("offers")
          .update({ active: false })
          .eq("id", offerId);

        toast.success("Offer cancelled successfully!");
        loadOffers();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error cancelling offer:", error);
    } finally {
      setCancellingOffer(null);
    }
  };

  const handleAcceptOffer = async (offer: Offer) => {
    setAcceptingOffer(offer.id);
    try {
      const success = await acceptOffer(nft!.token_id);
      
      if (success) {
        // Update offer status
        await supabase
          .from("offers")
          .update({ active: false })
          .eq("id", offer.id);

        // Update NFT owner
        await supabase
          .from("nfts")
          .update({ owner_address: offer.offerer_address.toLowerCase() })
          .eq("id", nft!.id);

        // Record transaction in HLS
        const priceInHLS = formatPrice(offer.price);
        await supabase.from("transactions").insert({
          nft_id: nft!.id,
          from_address: nft!.owner_address,
          to_address: offer.offerer_address.toLowerCase(),
          transaction_type: "offer_accepted",
          price: priceInHLS,
        });

        toast.success("Offer accepted successfully!");
        loadOffers();
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
    } finally {
      setAcceptingOffer(null);
    }
  };

  if (!nft) return null;

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const userOffers = offers.filter(
    (offer) => offer.offerer_address.toLowerCase() === userAddress
  );

  const isOwner = userAddress && nft.owner_address.toLowerCase() === userAddress;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{nft.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* NFT Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <img
              src={nft.image_url}
              alt={nft.name}
              className="w-full h-full object-cover"
            />
            {nft.listing?.active && (
              <Badge className="absolute top-3 right-3 sakura-gradient border-0">
                Listed
              </Badge>
            )}
          </div>

          {/* NFT Info */}
          <div className="space-y-4">
            {nft.description && (
              <div>
                <h3 className="font-semibold mb-1">Description</h3>
                <p className="text-muted-foreground">{nft.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-1">Owner</h3>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatAddress(nft.owner_address)}</span>
                </div>
              </div>

              {nft.listing?.price && (
                <div>
                  <h3 className="font-semibold mb-1">Price</h3>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold">
                      {formatPrice(nft.listing.price)} HELIOS
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buy Button */}
          {nft.listing?.active && onBuyNFT && (
            <>
              <Separator />
              <Button
                onClick={onBuyNFT}
                className="w-full sakura-gradient font-semibold"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Buy Now for {formatPrice(nft.listing.price)} HELIOS
              </Button>
            </>
          )}

          <Separator />

          {/* Make Offer Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Make an Offer</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="offerPrice">Offer Price (HELIOS)</Label>
                <Input
                  id="offerPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter your offer price"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleMakeOffer}
                disabled={loading || !offerPrice}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Making Offer...
                  </>
                ) : (
                  "Submit Offer"
                )}
              </Button>
            </div>
          </div>

          {/* Active Offers */}
          {(loadingOffers || offers.length > 0) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Active Offers</h3>
                {loadingOffers ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : offers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active offers yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {offers.map((offer) => {
                      const isUserOffer = offer.offerer_address.toLowerCase() === userAddress;
                      return (
                        <Card key={offer.id} className="p-4 card-gradient border border-border/50">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-bold text-lg text-gradient">
                                {formatPrice(offer.price)} HELIOS
                              </p>
                              <p className="text-sm text-muted-foreground">
                                by {formatAddress(offer.offerer_address)}
                                {isUserOffer && " (You)"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(offer.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {isOwner && !isUserOffer && (
                                <Button
                                  className="premium-gradient premium-button text-white shadow-lg hover:shadow-primary"
                                  size="sm"
                                  onClick={() => handleAcceptOffer(offer)}
                                  disabled={acceptingOffer === offer.id}
                                >
                                  {acceptingOffer === offer.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                      Accepting...
                                    </>
                                  ) : (
                                    "Accept"
                                  )}
                                </Button>
                              )}
                              {isUserOffer && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleCancelOffer(offer.id, nft.token_id)}
                                  disabled={cancellingOffer === offer.id}
                                >
                                  {cancellingOffer === offer.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                      Cancelling...
                                    </>
                                  ) : (
                                    "Cancel"
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
