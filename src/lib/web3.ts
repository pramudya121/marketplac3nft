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
  
  if (!ethereum) {
    console.error("No ethereum provider found");
    return null;
  }

  try {
    const provider = new BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    return signer;
  } catch (error) {
    console.error("Error getting signer:", error);
    return null;
  }
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
    if (!contract) {
      toast.error("Failed to connect to marketplace contract");
      return false;
    }

    const signer = await getSigner();
    if (!signer) {
      toast.error("Please connect your wallet first");
      return false;
    }

    // Validate listing exists and is active
    try {
      const listing = await contract.listings(listingId);
      if (!listing.active) {
        toast.error("This NFT is no longer listed for sale");
        return false;
      }
      
      // Use the actual listing price from contract, not the database
      const priceInWei = listing.price;
      
      // Check buyer's balance
      const balance = await signer.provider.getBalance(await signer.getAddress());
      if (balance < priceInWei) {
        toast.error("Insufficient HELIOS balance");
        return false;
      }
      
      toast.info("Buying NFT... Please confirm in your wallet");
      
      const tx = await contract.buyNFT(listingId, { 
        value: priceInWei,
        gasLimit: 500000 // Set explicit gas limit
      });
      
      toast.info("Purchase submitted. Waiting for confirmation...");
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast.success("NFT purchased successfully!");
        return true;
      } else {
        toast.error("Transaction failed");
        return false;
      }
    } catch (listingError: any) {
      console.error("Error fetching listing:", listingError);
      toast.error("Failed to verify listing details");
      return false;
    }
  } catch (error: any) {
    console.error("Error buying NFT:", error);
    
    // More detailed error messages
    if (error.code === "ACTION_REJECTED" || error.code === 4001) {
      toast.error("Transaction cancelled by user");
    } else if (error.message?.includes("insufficient funds")) {
      toast.error("Insufficient HELIOS balance");
    } else if (error.message?.includes("missing revert data")) {
      toast.error("Transaction failed. The listing may no longer be active or you may be the seller.");
    } else {
      toast.error(error.reason || error.message || "Failed to buy NFT");
    }
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

export async function getBalance(): Promise<string> {
  try {
    const signer = await getSigner();
    if (!signer) return "0";
    
    const balance = await signer.provider.getBalance(await signer.getAddress());
    return formatEther(balance);
  } catch (error) {
    console.error("Error getting balance:", error);
    return "0";
  }
}

// Transfer NFT
export async function transferNFT(to: string, tokenId: number): Promise<boolean> {
  try {
    const contract = await getNFTContract();
    if (!contract) return false;

    const signer = await getSigner();
    const from = await signer?.getAddress();

    toast.info("Transferring NFT... Please confirm in your wallet");
    
    const tx = await contract.transferFrom(from, to, tokenId);
    toast.info("Transfer submitted. Waiting for confirmation...");
    
    await tx.wait();
    toast.success("NFT transferred successfully!");
    return true;
  } catch (error: any) {
    console.error("Error transferring NFT:", error);
    toast.error(error.reason || "Failed to transfer NFT");
    return false;
  }
}

// Cancel Offer
export async function cancelOffer(tokenId: number): Promise<boolean> {
  try {
    const contract = await getOfferContract();
    if (!contract) return false;

    toast.info("Cancelling offer... Please confirm in your wallet");
    
    const tx = await contract.cancelOffer(CONTRACTS.nftCollection, tokenId);
    toast.info("Cancellation submitted. Waiting for confirmation...");
    
    await tx.wait();
    toast.success("Offer cancelled successfully!");
    return true;
  } catch (error: any) {
    console.error("Error cancelling offer:", error);
    toast.error(error.reason || "Failed to cancel offer");
    return false;
  }
}

// View Functions - Marketplace
export async function getMarketplaceFee(): Promise<number> {
  try {
    const contract = await getMarketplaceContract();
    if (!contract) return 0;
    
    const fee = await contract.marketplaceFee();
    return Number(fee);
  } catch (error) {
    console.error("Error getting marketplace fee:", error);
    return 0;
  }
}

export async function getFeeRecipient(): Promise<string> {
  try {
    const contract = await getMarketplaceContract();
    if (!contract) return "";
    
    return await contract.feeRecipient();
  } catch (error) {
    console.error("Error getting fee recipient:", error);
    return "";
  }
}

export async function getListingCount(): Promise<number> {
  try {
    const contract = await getMarketplaceContract();
    if (!contract) return 0;
    
    const count = await contract.listingCount();
    return Number(count);
  } catch (error) {
    console.error("Error getting listing count:", error);
    return 0;
  }
}

export async function getListingDetails(listingId: number): Promise<any> {
  try {
    const contract = await getMarketplaceContract();
    if (!contract) return null;
    
    const listing = await contract.listings(listingId);
    return {
      seller: listing.seller,
      nft: listing.nft,
      tokenId: Number(listing.tokenId),
      price: listing.price.toString(),
      active: listing.active,
    };
  } catch (error) {
    console.error("Error getting listing details:", error);
    return null;
  }
}

export async function getMarketplaceOwner(): Promise<string> {
  try {
    const contract = await getMarketplaceContract();
    if (!contract) return "";
    
    return await contract.owner();
  } catch (error) {
    console.error("Error getting marketplace owner:", error);
    return "";
  }
}

// View Functions - NFT
export async function getNFTBalance(address: string): Promise<number> {
  try {
    const contract = await getNFTContract();
    if (!contract) return 0;
    
    const balance = await contract.balanceOf(address);
    return Number(balance);
  } catch (error) {
    console.error("Error getting NFT balance:", error);
    return 0;
  }
}

export async function getApprovedAddress(tokenId: number): Promise<string> {
  try {
    const contract = await getNFTContract();
    if (!contract) return "";
    
    return await contract.getApproved(tokenId);
  } catch (error) {
    console.error("Error getting approved address:", error);
    return "";
  }
}

export async function getNFTName(): Promise<string> {
  try {
    const contract = await getNFTContract();
    if (!contract) return "";
    
    return await contract.name();
  } catch (error) {
    console.error("Error getting NFT name:", error);
    return "";
  }
}

export async function getNFTSymbol(): Promise<string> {
  try {
    const contract = await getNFTContract();
    if (!contract) return "";
    
    return await contract.symbol();
  } catch (error) {
    console.error("Error getting NFT symbol:", error);
    return "";
  }
}

export async function getOwnerOf(tokenId: number): Promise<string> {
  try {
    const contract = await getNFTContract();
    if (!contract) return "";
    
    return await contract.ownerOf(tokenId);
  } catch (error) {
    console.error("Error getting owner of token:", error);
    return "";
  }
}

export async function getTokenURI(tokenId: number): Promise<string> {
  try {
    const contract = await getNFTContract();
    if (!contract) return "";
    
    return await contract.tokenURI(tokenId);
  } catch (error) {
    console.error("Error getting token URI:", error);
    return "";
  }
}

export async function getTotalMinted(): Promise<number> {
  try {
    const contract = await getNFTContract();
    if (!contract) return 0;
    
    const total = await contract.totalMinted();
    return Number(total);
  } catch (error) {
    console.error("Error getting total minted:", error);
    return 0;
  }
}

// View Functions - Offer
export async function getOfferDetails(tokenId: number): Promise<any> {
  try {
    const contract = await getOfferContract();
    if (!contract) return null;
    
    const offer = await contract.offers(CONTRACTS.nftCollection, tokenId);
    return {
      offerer: offer.offerer,
      price: offer.price.toString(),
    };
  } catch (error) {
    console.error("Error getting offer details:", error);
    return null;
  }
}

// Admin Functions - Marketplace (only for owner)
export async function setMarketplaceFee(fee: number): Promise<boolean> {
  try {
    const contract = await getMarketplaceContract();
    if (!contract) return false;

    toast.info("Setting marketplace fee... Please confirm in your wallet");
    
    const tx = await contract.setFee(fee);
    toast.info("Transaction submitted. Waiting for confirmation...");
    
    await tx.wait();
    toast.success("Marketplace fee updated successfully!");
    return true;
  } catch (error: any) {
    console.error("Error setting marketplace fee:", error);
    toast.error(error.reason || "Failed to set marketplace fee");
    return false;
  }
}

export async function setFeeRecipient(recipient: string): Promise<boolean> {
  try {
    const contract = await getMarketplaceContract();
    if (!contract) return false;

    toast.info("Setting fee recipient... Please confirm in your wallet");
    
    const tx = await contract.setFeeRecipient(recipient);
    toast.info("Transaction submitted. Waiting for confirmation...");
    
    await tx.wait();
    toast.success("Fee recipient updated successfully!");
    return true;
  } catch (error: any) {
    console.error("Error setting fee recipient:", error);
    toast.error(error.reason || "Failed to set fee recipient");
    return false;
  }
}
