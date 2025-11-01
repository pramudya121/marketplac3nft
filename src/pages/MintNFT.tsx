import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WalletConnect } from "@/components/WalletConnect";
import { mintNFT, getSigner } from "@/lib/web3";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { SakuraAnimation } from "@/components/SakuraAnimation";
import { CONTRACTS } from "@/lib/contracts";

const MintNFT = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMint = async () => {
    if (!imageFile || !formData.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Check wallet connection first
      if (!window.ethereum) {
        toast.error("Please install MetaMask or another Web3 wallet");
        return;
      }

      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length === 0) {
        toast.error("Please connect your wallet first");
        return;
      }

      const signer = await getSigner();
      if (!signer) {
        toast.error("Failed to get signer. Please reconnect your wallet");
        return;
      }

      setLoading(true);

      // Upload image to Supabase Storage
      toast.info("Uploading image...");
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("nft-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error("Failed to upload image: " + uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("nft-images")
        .getPublicUrl(filePath);

      // Create metadata
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: publicUrl,
      };

      // For simplicity, we'll use the public URL as metadata URI
      const metadataUri = publicUrl;

      // Mint NFT on blockchain - this will trigger MetaMask popup
      toast.info("Please confirm the transaction in your wallet...");
      const tokenId = await mintNFT(metadataUri);
      
      if (tokenId === null) {
        throw new Error("Failed to mint NFT on blockchain");
      }

      // Save to Supabase
      const address = await signer.getAddress();
      const { error: dbError } = await supabase.from("nfts").insert({
        name: formData.name,
        description: formData.description,
        image_url: publicUrl,
        metadata_uri: metadataUri,
        token_id: tokenId,
        owner_address: address.toLowerCase(),
        contract_address: CONTRACTS.nftCollection.toLowerCase(),
      });

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Failed to save NFT to database: " + dbError.message);
      }

      // Record transaction
      await supabase.from("transactions").insert({
        nft_id: null, // Will be updated after insert
        from_address: "0x0000000000000000000000000000000000000000",
        to_address: address.toLowerCase(),
        transaction_type: "mint",
        price: null,
      });

      toast.success("NFT minted successfully!");
      setTimeout(() => {
        navigate("/marketplace");
      }, 1500);
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      
      // User rejected transaction
      if (error.code === 4001 || error.message?.includes("user rejected")) {
        toast.error("Transaction rejected by user");
      } else if (error.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds for transaction");
      } else {
        toast.error(error.message || "Failed to mint NFT");
      }
    } finally {
      setLoading(false);
    }
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Mint Your NFT</h1>
          <p className="text-muted-foreground mb-8">
            Create your unique digital asset on the Helios blockchain
          </p>

          <Card className="p-6">
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <Label htmlFor="image">Image *</Label>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="image"
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                      </div>
                      <input
                        id="image"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="My Awesome NFT"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your NFT..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Mint Button */}
              <Button
                className="w-full"
                onClick={handleMint}
                disabled={loading || !imageFile || !formData.name}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Mint NFT
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MintNFT;
