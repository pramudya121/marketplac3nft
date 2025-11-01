import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnect } from "@/components/WalletConnect";
import { SakuraAnimation } from "@/components/SakuraAnimation";
import { 
  getMarketplaceFee, 
  getFeeRecipient, 
  getMarketplaceOwner,
  setMarketplaceFee,
  setFeeRecipient,
  getSigner
} from "@/lib/web3";
import { toast } from "sonner";
import { Loader2, Settings, ArrowLeft, Shield } from "lucide-react";
import heroImage from "@/assets/hero-sakura.jpg";

const Admin = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Current values
  const [currentFee, setCurrentFee] = useState<number>(0);
  const [currentRecipient, setCurrentRecipient] = useState<string>("");
  const [marketplaceOwner, setMarketplaceOwner] = useState<string>("");
  
  // Form values
  const [newFee, setNewFee] = useState("");
  const [newRecipient, setNewRecipient] = useState("");

  useEffect(() => {
    checkWalletAndLoadData();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setWalletAddress(accounts.length > 0 ? accounts[0] : null);
        checkWalletAndLoadData();
      });
    }
  }, []);

  const checkWalletAndLoadData = async () => {
    setLoading(true);
    try {
      const signer = await getSigner();
      if (signer) {
        const address = await signer.getAddress();
        setWalletAddress(address);

        // Load marketplace data
        const [fee, recipient, owner] = await Promise.all([
          getMarketplaceFee(),
          getFeeRecipient(),
          getMarketplaceOwner()
        ]);

        setCurrentFee(fee);
        setCurrentRecipient(recipient);
        setMarketplaceOwner(owner);
        setNewFee(fee.toString());
        setNewRecipient(recipient);

        // Check if connected wallet is the authorized admin
        const authorizedAdmin = "0x938b31bcc5fced235ebcbf776d443ae5080c56fa";
        setIsOwner(address.toLowerCase() === authorizedAdmin.toLowerCase());
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast.error("Failed to load marketplace data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFee = async () => {
    if (!newFee || parseFloat(newFee) < 0) {
      toast.error("Please enter a valid fee (0-10000, representing basis points)");
      return;
    }

    const feeValue = parseInt(newFee);
    if (feeValue > 10000) {
      toast.error("Fee cannot exceed 10000 basis points (100%)");
      return;
    }

    setUpdating(true);
    try {
      const success = await setMarketplaceFee(feeValue);
      if (success) {
        setCurrentFee(feeValue);
        toast.success("Marketplace fee updated successfully!");
      }
    } catch (error) {
      console.error("Error updating fee:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateRecipient = async () => {
    if (!newRecipient || !/^0x[a-fA-F0-9]{40}$/.test(newRecipient)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    setUpdating(true);
    try {
      const success = await setFeeRecipient(newRecipient);
      if (success) {
        setCurrentRecipient(newRecipient);
        toast.success("Fee recipient updated successfully!");
      }
    } catch (error) {
      console.error("Error updating recipient:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SakuraAnimation />
      
      {/* Hero Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.3)',
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-sm bg-background/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  SakuraMarket
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-4">
                <Link to="/">
                  <Button variant="ghost">Home</Button>
                </Link>
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
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Settings className="w-10 h-10" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground">
              Manage marketplace settings and configurations
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !walletAddress ? (
            <Card className="frost-glass border-white/20">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Please connect your wallet to access admin panel
                </p>
                <WalletConnect />
              </CardContent>
            </Card>
          ) : !isOwner ? (
            <Card className="frost-glass border-white/20 border-destructive/50">
              <CardContent className="pt-6 text-center space-y-4">
                <Shield className="w-16 h-16 mx-auto text-destructive" />
                <h2 className="text-xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground">
                  You are not the owner of this marketplace contract.
                </p>
                <div className="text-sm space-y-1">
                  <p>Your Address: <code className="text-xs">{walletAddress}</code></p>
                  <p>Owner Address: <code className="text-xs">{marketplaceOwner}</code></p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Current Settings */}
              <Card className="frost-glass border-white/20">
                <CardHeader>
                  <CardTitle>Current Marketplace Settings</CardTitle>
                  <CardDescription>
                    View current marketplace configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Current Fee (Basis Points)</Label>
                      <p className="text-2xl font-bold">{currentFee}</p>
                      <p className="text-xs text-muted-foreground">
                        {(currentFee / 100).toFixed(2)}% fee
                      </p>
                    </div>
                    <div>
                      <Label>Fee Recipient</Label>
                      <p className="text-sm font-mono break-all">{currentRecipient}</p>
                    </div>
                  </div>
                  <div>
                    <Label>Marketplace Owner</Label>
                    <p className="text-sm font-mono break-all">{marketplaceOwner}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Update Fee */}
              <Card className="frost-glass border-white/20">
                <CardHeader>
                  <CardTitle>Update Marketplace Fee</CardTitle>
                  <CardDescription>
                    Set the marketplace fee in basis points (1 basis point = 0.01%)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="newFee">New Fee (Basis Points)</Label>
                    <Input
                      id="newFee"
                      type="number"
                      min="0"
                      max="10000"
                      placeholder="250"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      disabled={updating}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {newFee ? `${(parseInt(newFee) / 100).toFixed(2)}% fee` : "Enter fee amount"}
                    </p>
                  </div>
                  <Button
                    onClick={handleUpdateFee}
                    disabled={updating || !newFee}
                    className="w-full sakura-gradient"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Fee"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Update Fee Recipient */}
              <Card className="frost-glass border-white/20">
                <CardHeader>
                  <CardTitle>Update Fee Recipient</CardTitle>
                  <CardDescription>
                    Set the address that will receive marketplace fees
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="newRecipient">New Recipient Address</Label>
                    <Input
                      id="newRecipient"
                      type="text"
                      placeholder="0x..."
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      disabled={updating}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateRecipient}
                    disabled={updating || !newRecipient}
                    className="w-full sakura-gradient"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Recipient"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
