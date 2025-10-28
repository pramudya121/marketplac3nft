import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, ChevronDown } from "lucide-react";
import { connectWallet, WalletType } from "@/lib/web3";
import { cn } from "@/lib/utils";

export const WalletConnect = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        }
      }
    };
    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAddress(accounts.length > 0 ? accounts[0] : null);
      });
    }
  }, []);

  const handleConnect = async (walletType: WalletType) => {
    setIsConnecting(true);
    const account = await connectWallet(walletType);
    if (account) {
      setAddress(account);
    }
    setIsConnecting(false);
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (address) {
    return (
      <Button variant="outline" className="font-medium backdrop-blur-sm">
        <Wallet className="mr-2 h-4 w-4" />
        {formatAddress(address)}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          disabled={isConnecting}
          className={cn(
            "sakura-gradient font-semibold shadow-md hover:shadow-lg",
            "transition-all duration-300"
          )}
        >
          <Wallet className="mr-2 h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleConnect("metamask")}>
          <div className="flex items-center">
            <div className="mr-2 h-6 w-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600" />
            MetaMask
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleConnect("okx")}>
          <div className="flex items-center">
            <div className="mr-2 h-6 w-6 rounded-full bg-gradient-to-br from-black to-gray-700" />
            OKX Wallet
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleConnect("bitget")}>
          <div className="flex items-center">
            <div className="mr-2 h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
            Bitget Wallet
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
