import { NFTCard } from "./NFTCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface NFT {
  id: string;
  token_id: number;
  name: string;
  description?: string;
  image_url: string;
  owner_address: string;
  listing?: {
    listing_id: number;
    price: string;
    active: boolean;
  };
}

interface NFTGridProps {
  nfts: NFT[];
  loading?: boolean;
  onBuyNFT?: (nft: NFT) => void;
  onMakeOffer?: (nft: NFT) => void;
  showActions?: boolean;
  userAddress?: string;
  customAction?: {
    label: string | ((nft: NFT) => string);
    onClick: (nft: NFT) => void;
    condition?: (nft: NFT) => boolean;
    secondaryAction?: {
      label: string;
      onClick: (nft: NFT) => void;
    };
  };
}

export const NFTGrid = ({ 
  nfts, 
  loading, 
  onBuyNFT, 
  onMakeOffer,
  showActions = true,
  userAddress,
  customAction,
}: NFTGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-24 h-24 rounded-full glass-card border border-primary/20 flex items-center justify-center mb-6 animate-float">
          <div className="text-5xl">🎨</div>
        </div>
        <h3 className="text-3xl font-bold mb-3">No NFTs Found</h3>
        <p className="text-muted-foreground text-lg max-w-md mb-8">
          Be the first to mint and list an NFT in this marketplace! Create something amazing and start trading.
        </p>
        <Link to="/mint">
          <Button className="premium-gradient h-12 px-8 font-semibold premium-button text-white shadow-lg">
            Mint Your First NFT
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {nfts.map((nft) => (
        <NFTCard
          key={nft.id}
          tokenId={nft.token_id}
          nftId={nft.id}
          name={nft.name}
          description={nft.description}
          imageUrl={nft.image_url}
          owner={nft.owner_address}
          price={nft.listing?.price}
          isListed={nft.listing?.active || false}
          onBuy={onBuyNFT ? () => onBuyNFT(nft) : undefined}
          onMakeOffer={onMakeOffer ? () => onMakeOffer(nft) : undefined}
          showActions={showActions}
          userAddress={userAddress}
          customAction={customAction ? {
            label: typeof customAction.label === 'function' ? customAction.label(nft) : customAction.label,
            onClick: () => customAction.onClick(nft),
            show: !customAction.condition || customAction.condition(nft),
            secondaryLabel: customAction.secondaryAction?.label,
            onSecondaryClick: customAction.secondaryAction ? () => customAction.secondaryAction.onClick(nft) : undefined
          } : undefined}
        />
      ))}
    </div>
  );
};
