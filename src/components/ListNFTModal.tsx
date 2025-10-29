import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { approveNFT, listNFT } from "@/lib/web3";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseEther } from "ethers";

interface ListNFTModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: any;
  onSuccess?: () => void;
}

export const ListNFTModal = ({ open, onOpenChange, nft, onSuccess }: ListNFTModalProps) => {
  const [price, setPrice] = useState("");
  const [isListing, setIsListing] = useState(false);

  const handleList = async () => {
    if (!price || parseFloat(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsListing(true);
    try {
      // Step 1: Approve NFT
      const approved = await approveNFT(nft.token_id);
      if (!approved) {
        setIsListing(false);
        return;
      }

      // Step 2: List NFT
      const listed = await listNFT(nft.token_id, price);
      if (!listed) {
        setIsListing(false);
        return;
      }

      // Step 3: Update database
      const priceInWei = parseEther(price).toString();
      const { error } = await supabase.from("listings").insert({
        nft_id: nft.id,
        seller_address: nft.owner_address,
        price: priceInWei,
        listing_id: nft.token_id,
        active: true,
      });

      if (error) throw error;

      toast.success("NFT listed successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error listing NFT:", error);
      toast.error("Failed to list NFT");
    } finally {
      setIsListing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>List NFT for Sale</DialogTitle>
          <DialogDescription>
            Set a price for your NFT on the marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>NFT Name</Label>
            <p className="text-sm font-medium">{nft.name}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (HELIOS)</Label>
            <Input
              id="price"
              type="number"
              step="0.001"
              min="0"
              placeholder="0.0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isListing}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isListing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleList}
            disabled={isListing || !price}
            className="flex-1 sakura-gradient"
          >
            {isListing ? "Listing..." : "List NFT"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
