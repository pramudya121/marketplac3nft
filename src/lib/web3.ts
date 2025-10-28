import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import { HELIOS_TESTNET, CONTRACTS, MARKETPLACE_ABI, NFT_COLLECTION_ABI, OFFER_ABI } from "./contracts";
import { toast } from "sonner";

declare global {
  interface Window {
    ethereum?: any;
    okxwallet?: any;
    bitkeep?: any;
  }
}

export type WalletType = "metamask" | "okx" | "bitget";

export async function connectWallet(walletType: WalletType = "metamask"): Promise<string | null> {
  try {
    let ethereum;
    
    switch (walletType) {
      case "okx":
        ethereum = window.okxwallet;
        if (!ethereum) {
          toast.error("OKX Wallet not found! Please install it.");
          return null;
        }
        break;
      case "bitget":
        ethereum = window.bitkeep?.ethereum;
        if (!ethereum) {
          toast.error("Bitget Wallet not found! Please install it.");
          return null;
        }
        break;
      default:
        ethereum = window.ethereum;
        if (!ethereum) {
          toast.error("MetaMask not found! Please install it.");
          return null;
        }
    }

    const provider = new BrowserProvider(ethereum);
    
    // Request account access
    const accounts = await provider.send("eth_requestAccounts", []);
    
    // Check if we're on Helios Testnet
    const network = await provider.getNetwork();
    
    if (Number(network.chainId) !== HELIOS_TESTNET.chainId) {
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${HELIOS_TESTNET.chainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to wallet
        if (switchError.code === 4902) {
          try {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${HELIOS_TESTNET.chainId.toString(16)}`,
                  chainName: HELIOS_TESTNET.name,
                  nativeCurrency: {
                    name: HELIOS_TESTNET.symbol,
                    symbol: HELIOS_TESTNET.symbol,
                    decimals: 18,
                  },
                  rpcUrls: [HELIOS_TESTNET.rpcUrl],
                  blockExplorerUrls: [HELIOS_TESTNET.blockExplorer],
                },
              ],
            });
          } catch (addError) {
            toast.error("Failed to add Helios network");
            return null;
          }
        } else {
          toast.error("Failed to switch to Helios network");
          return null;
        }
      }
    }

    toast.success("Wallet connected successfully!");
    return accounts[0];
  } catch (error) {
    console.error("Error connecting wallet:", error);
    toast.error("Failed to connect wallet");
    return null;
  }
}

export async function getSigner(walletType: WalletType = "metamask") {
  let ethereum;
  
  switch (walletType) {
    case "okx":
      ethereum = window.okxwallet;
      break;
    case "bitget":
      ethereum = window.bitkeep?.ethereum;
      break;
    default:
      ethereum = window.ethereum;
  }
  
  if (!ethereum) return null;
  
  const provider = new BrowserProvider(ethereum);
  return provider.getSigner();
}

export async function getMarketplaceContract() {
  const signer = await getSigner();
  if (!signer) return null;
  
  return new Contract(CONTRACTS.marketplace, MARKETPLACE_ABI, signer);
}

export async function getNFTContract() {
  const signer = await getSigner();
  if (!signer) return null;
  
  return new Contract(CONTRACTS.nftCollection, NFT_COLLECTION_ABI, signer);
}

export async function getOfferContract() {
  const signer = await getSigner();
  if (!signer) return null;
  
  return new Contract(CONTRACTS.offer, OFFER_ABI, signer);
}

export async function mintNFT(metadataUri: string): Promise<number | null> {
  try {
    const contract = await getNFTContract();
    if (!contract) {
      toast.error("Failed to connect to NFT contract");
      return null;
    }

    const signer = await getSigner();
    const address = await signer?.getAddress();

    toast.info("Minting NFT... Please confirm in your wallet");
    
    const tx = await contract.mintNFT(address, metadataUri);
    toast.info("Transaction submitted. Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    // Get token ID from event
    const event = receipt.logs.find((log: any) => {
      try {
        return contract.interface.parseLog(log)?.name === "Minted";
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsedLog = contract.interface.parseLog(event);
      const tokenId = Number(parsedLog?.args[1]);
      toast.success("NFT minted successfully!");
      return tokenId;
    }
    
    return null;
  } catch (error: any) {
    console.error("Error minting NFT:", error);
    toast.error(error.reason || "Failed to mint NFT");
    return null;
  }
}

export async function approveNFT(tokenId: number): Promise<boolean> {
  try {
    const contract = await getNFTContract();
    if (!contract) return false;

    toast.info("Approving NFT... Please confirm in your wallet");
    
    const tx = await contract.approve(CONTRACTS.marketplace, tokenId);
    toast.info("Approval submitted. Waiting for confirmation...");
    
    await tx.wait();
    toast.success("NFT approved for marketplace!");
    return true;
  } catch (error: any) {
    console.error("Error approving NFT:", error);
    toast.error(error.reason || "Failed to approve NFT");
    return false;
  }
}

export async function listNFT(tokenId: number, price: string): Promise<boolean> {
  try {
    const contract = await getMarketplaceContract();
    if (!contract) return false;

    const priceInWei = parseEther(price);
    
    toast.info("Listing NFT... Please confirm in your wallet");
    
    const tx = await contract.listNFT(CONTRACTS.nftCollection, tokenId, priceInWei);
    toast.info("Listing submitted. Waiting for confirmation...");
    
    await tx.wait();
    toast.success("NFT listed successfully!");
    return true;
  } catch (error: any) {
    console.error("Error listing NFT:", error);
    toast.error(error.reason || "Failed to list NFT");
    return false;
  }
}

export async function buyNFT(listingId: number, price: string): Promise<boolean> {
  try {
    const contract = await getMarketplaceContract();
    if (!contract) return false;

    const priceInWei = parseEther(price);
    
    toast.info("Buying NFT... Please confirm in your wallet");
    
    const tx = await contract.buyNFT(listingId, { value: priceInWei });
    toast.info("Purchase submitted. Waiting for confirmation...");
    
    await tx.wait();
    toast.success("NFT purchased successfully!");
    return true;
  } catch (error: any) {
    console.error("Error buying NFT:", error);
    toast.error(error.reason || "Failed to buy NFT");
    return false;
  }
}

export async function makeOffer(tokenId: number, offerPrice: string): Promise<boolean> {
  try {
    const contract = await getOfferContract();
    if (!contract) return false;

    const priceInWei = parseEther(offerPrice);
    
    toast.info("Making offer... Please confirm in your wallet");
    
    const tx = await contract.makeOffer(CONTRACTS.nftCollection, tokenId, { value: priceInWei });
    toast.info("Offer submitted. Waiting for confirmation...");
    
    await tx.wait();
    toast.success("Offer made successfully!");
    return true;
  } catch (error: any) {
    console.error("Error making offer:", error);
    toast.error(error.reason || "Failed to make offer");
    return false;
  }
}

export async function acceptOffer(tokenId: number): Promise<boolean> {
  try {
    const contract = await getOfferContract();
    if (!contract) return false;

    toast.info("Accepting offer... Please confirm in your wallet");
    
    const tx = await contract.acceptOffer(CONTRACTS.nftCollection, tokenId);
    toast.info("Acceptance submitted. Waiting for confirmation...");
    
    await tx.wait();
    toast.success("Offer accepted successfully!");
    return true;
  } catch (error: any) {
    console.error("Error accepting offer:", error);
    toast.error(error.reason || "Failed to accept offer");
    return false;
  }
}

export function formatPrice(price: string): string {
  return formatEther(price);
}
