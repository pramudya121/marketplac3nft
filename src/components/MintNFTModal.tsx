import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { mintNFT } from "@/lib/web3";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MintNFTModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  walletAddress?: string;
}

export const MintNFTModal = ({ open, onOpenChange, onSuccess, walletAddress }: MintNFTModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleMint = async () => {
    if (!file || !name || !walletAddress) {
      toast.error("Please fill all fields and connect wallet");
      return;
    }

    setLoading(true);

    try {
      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${walletAddress}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("nft-images")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("nft-images")
        .getPublicUrl(filePath);

      // Create metadata JSON
      const metadata = {
        name,
        description,
        image: publicUrl,
      };

      // For simplicity, we'll store metadata in our database and use the image URL as tokenURI
      // In production, you'd want to upload metadata to IPFS
      const metadataUri = publicUrl;

      // Mint NFT on blockchain
      const tokenId = await mintNFT(metadataUri);

      if (tokenId === null) {
        throw new Error("Failed to mint NFT");
      }

      // Save to database
      const { error: dbError } = await supabase.from("nfts").insert({
        token_id: tokenId,
        contract_address: "0xEc94943b75359f1ede3d639AD548e56239d754c2",
        owner_address: walletAddress,
        name,
        description,
        image_url: publicUrl,
        metadata_uri: metadataUri,
      });

      if (dbError) {
        console.error("Database error:", dbError);
      }

      toast.success("NFT minted successfully!");
      setName("");
      setDescription("");
      setFile(null);
      setPreview("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      toast.error(error.message || "Failed to mint NFT");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient">
            Mint New NFT 🌸
          </DialogTitle>
          <DialogDescription>
            Upload your artwork and create an NFT on Helios blockchain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <div className="relative">
              {preview ? (
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border-2 border-dashed border-primary">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setFile(null);
                      setPreview("");
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload image</span>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My Awesome NFT"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your NFT..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMint}
            disabled={loading || !file || !name || !walletAddress}
            className="flex-1 sakura-gradient font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Minting...
              </>
            ) : (
              "Mint NFT"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
