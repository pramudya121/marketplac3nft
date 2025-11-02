import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { makeOffer } from "@/lib/web3";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface MakeOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: {
    id: string;
    token_id: number;
    name: string;
    image_url: string;
  };
  onSuccess?: () => void;
}

export const MakeOfferModal = ({
  open,
  onOpenChange,
  nft,
  onSuccess,
}: MakeOfferModalProps) => {
  const [offerPrice, setOfferPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMakeOffer = async () => {
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      toast.error("Please enter a valid offer price");
      return;
    }

    try {
      setLoading(true);

      // Make offer on blockchain
      const success = await makeOffer(nft.token_id, offerPrice);
      if (!success) {
        throw new Error("Failed to make offer on blockchain");
      }

      // Get wallet address
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      const offererAddress = accounts[0].toLowerCase();

      // Convert price to Wei for database (to match blockchain state)
      const priceInWei = (parseFloat(offerPrice) * 1e18).toString();

      // Save offer to database
      const { error: dbError } = await supabase.from("offers").insert({
        nft_id: nft.id,
        offerer_address: offererAddress,
        price: priceInWei,
        active: true,
      });

      if (dbError) throw dbError;

      // Record transaction in HLS for easy reading
      await supabase.from("transactions").insert({
        nft_id: nft.id,
        from_address: offererAddress,
        to_address: "0x0000000000000000000000000000000000000000",
        transaction_type: "offer",
        price: offerPrice,
      });

      toast.success("Offer made successfully!");
      onOpenChange(false);
      setOfferPrice("");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error making offer:", error);
      toast.error(error.message || "Failed to make offer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make an Offer</DialogTitle>
          <DialogDescription>
            Make an offer for {nft.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="aspect-square w-full overflow-hidden rounded-lg">
            <img
              src={nft.image_url}
              alt={nft.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <Label htmlFor="offerPrice">Offer Price (HLS)</Label>
            <Input
              id="offerPrice"
              type="number"
              step="0.0001"
              placeholder="0.0"
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
              "Make Offer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
