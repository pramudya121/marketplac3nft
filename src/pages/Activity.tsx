import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/components/WalletConnect";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SakuraAnimation } from "@/components/SakuraAnimation";
import { ActivityFeed } from "@/components/ActivityFeed";

const Activity = () => {

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
            <Link to="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
            <Link to="/activity">
              <Button variant="ghost">Activity</Button>
            </Link>
            <ThemeToggle />
            <WalletConnect />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">Activity</h1>
        <p className="text-muted-foreground mb-8">
          Real-time marketplace activity and transactions
        </p>

        <ActivityFeed limit={50} showTitle={false} />
      </div>
    </div>
  );
};

export default Activity;
