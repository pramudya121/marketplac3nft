import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Wallet, ChevronDown, User } from "lucide-react";
import { connectWallet, WalletType, getBalance } from "@/lib/web3";
import { cn } from "@/lib/utils";

export const WalletConnect = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          loadBalance();
        }
      }
    };
    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAddress(accounts.length > 0 ? accounts[0] : null);
        if (accounts.length > 0) {
          loadBalance();
        }
      });
    }
  }, []);

  const loadBalance = async () => {
    const bal = await getBalance();
    setBalance(parseFloat(bal).toFixed(4));
  };

  const handleConnect = async (walletType: WalletType) => {
    setIsConnecting(true);
    const account = await connectWallet(walletType);
    if (account) {
      setAddress(account);
      loadBalance();
    }
    setIsConnecting(false);
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="font-medium backdrop-blur-sm">
            <Wallet className="mr-2 h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="text-xs">{balance} HELIOS</span>
              <span className="text-xs">{formatAddress(address)}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate(`/profile/${address}`)}>
            <User className="mr-2 h-4 w-4" />
            My Profile
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
