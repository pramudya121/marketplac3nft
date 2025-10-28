import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Tag, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
}: NFTCardProps) => {
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <Card className={cn("card-hover overflow-hidden border-2", className)}>
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
          />
          {isListed && (
            <Badge className="absolute top-3 right-3 sakura-gradient border-0">
              Listed
            </Badge>
          )}
        </div>
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-lg mb-1">{name}</h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{formatAddress(owner)}</span>
          </div>

          {price && (
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-bold text-lg">{price} HELIOS</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        {isListed && onBuy && (
          <Button 
            onClick={onBuy} 
            className="flex-1 sakura-gradient font-semibold"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Buy Now
          </Button>
        )}
        {onMakeOffer && (
          <Button 
            onClick={onMakeOffer} 
            variant="outline"
            className="flex-1 font-semibold"
          >
            Make Offer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
