import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Tag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/web3";

interface NFTCardProps {
  tokenId: number;
  name: string;
  description?: string;
  imageUrl: string;
  price?: string;
  owner: string;
  isListed: boolean;
  onBuy?: () => void;
  onMakeOffer?: () => void;
  className?: string;
  showActions?: boolean;
  customAction?: {
    label: string;
    onClick: () => void;
    show: boolean;
    secondaryLabel?: string;
    onSecondaryClick?: () => void;
  };
}

export const NFTCard = ({
  tokenId,
  name,
  description,
  imageUrl,
  price,
  owner,
  isListed,
  onBuy,
  onMakeOffer,
  className,
  showActions = true,
  customAction,
}: NFTCardProps) => {
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <Card className={cn("card-hover overflow-hidden card-gradient border border-border/50", className)}>
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden group">
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {isListed && (
            <Badge className="absolute top-3 right-3 premium-gradient border-0 text-white font-semibold shadow-lg">
              For Sale
            </Badge>
          )}
          <div className="absolute top-3 left-3 glass-card px-3 py-1 rounded-full">
            <span className="text-xs font-medium text-foreground">#{tokenId}</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <h3 className="font-bold text-xl mb-1.5 truncate">{name}</h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <span className="text-muted-foreground">{formatAddress(owner)}</span>
          </div>

          {price && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Current Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gradient">{formatPrice(price)}</span>
                <span className="text-sm text-muted-foreground">HELIOS</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {(showActions || customAction?.show) && (
        <CardFooter className="p-5 pt-0 gap-3">
          {customAction?.show ? (
            <>
              <Button 
                onClick={customAction.onClick}
                className="flex-1 premium-gradient font-semibold h-11 premium-button text-white shadow-lg hover:shadow-primary"
              >
                {customAction.label}
              </Button>
              {customAction.secondaryLabel && customAction.onSecondaryClick && (
                <Button 
                  onClick={customAction.onSecondaryClick}
                  variant="outline"
                  className="flex-1 font-semibold h-11 border-primary/30 hover:border-primary hover:bg-primary/10"
                >
                  {customAction.secondaryLabel}
                </Button>
              )}
            </>
          ) : showActions ? (
            <>
              {isListed && onBuy && (
                <Button 
                  onClick={onBuy} 
                  className="flex-1 premium-gradient font-semibold h-11 premium-button text-white shadow-lg hover:shadow-primary"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Buy Now
                </Button>
              )}
              {onMakeOffer && (
                <Button 
                  onClick={onMakeOffer} 
                  variant="outline"
                  className="flex-1 font-semibold h-11 border-primary/30 hover:border-primary hover:bg-primary/10"
                >
                  View Details
                </Button>
              )}
            </>
          ) : null}
        </CardFooter>
      )}
    </Card>
  );
};
