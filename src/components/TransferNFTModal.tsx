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
import { transferNFT } from "@/lib/web3";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TransferNFTModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: any;
  onSuccess?: () => void;
}

export const TransferNFTModal = ({ open, onOpenChange, nft, onSuccess }: TransferNFTModalProps) => {
  const [toAddress, setToAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransfer = async () => {
    if (!toAddress || !toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    setIsTransferring(true);
    try {
      const success = await transferNFT(toAddress, nft.token_id);
      
      if (success) {
        // Update database
        await supabase
          .from("nfts")
          .update({ owner_address: toAddress.toLowerCase() })
          .eq("id", nft.id);

        // Deactivate any active listings
        await supabase
          .from("listings")
          .update({ active: false })
          .eq("nft_id", nft.id)
          .eq("active", true);

        await supabase.from("transactions").insert({
          nft_id: nft.id,
          from_address: nft.owner_address,
          to_address: toAddress.toLowerCase(),
          transaction_type: "transfer",
        });

        toast.success("NFT transferred successfully!");
        onOpenChange(false);
        setToAddress("");
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error transferring NFT:", error);
      toast.error("Failed to transfer NFT");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer NFT</DialogTitle>
          <DialogDescription>
            Transfer this NFT to another wallet address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>NFT Name</Label>
            <p className="text-sm font-medium">{nft.name}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Recipient Address</Label>
            <Input
              id="address"
              placeholder="0x..."
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              disabled={isTransferring}
            />
            <p className="text-xs text-muted-foreground">
              Enter the wallet address of the recipient
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setToAddress("");
            }}
            disabled={isTransferring}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={isTransferring || !toAddress}
            className="flex-1 sakura-gradient"
          >
            {isTransferring ? "Transferring..." : "Transfer NFT"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
