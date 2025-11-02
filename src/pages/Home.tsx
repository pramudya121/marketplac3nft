import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, ShoppingBag, Palette, Activity } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";
import { SakuraAnimation } from "@/components/SakuraAnimation";

const Home = () => {
  return (
    <div className="min-h-screen">
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
            <WalletConnect />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Discover, Collect & Trade NFTs
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          The premier NFT marketplace on Helios Testnet. Create, buy, sell, and discover unique digital assets.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/marketplace">
            <Button size="lg" className="gap-2">
              <ShoppingBag className="w-5 h-5" />
              Explore Marketplace
            </Button>
          </Link>
          <Link to="/mint">
            <Button size="lg" variant="outline" className="gap-2">
              <Palette className="w-5 h-5" />
              Mint Your NFT
            </Button>
          </Link>
          <Link to="/statistics">
            <Button size="lg" variant="outline" className="gap-2">
              Statistics
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Create NFTs</h3>
            <p className="text-muted-foreground">
              Mint your unique digital assets on the Helios blockchain with just a few clicks.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Trade & Collect</h3>
            <p className="text-muted-foreground">
              Buy, sell, and make offers on NFTs in our secure marketplace with low fees.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Track Activity</h3>
            <p className="text-muted-foreground">
              Monitor all transactions and market activity in real-time on the blockchain.
            </p>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">100%</div>
            <div className="text-muted-foreground">Decentralized</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">Low Fees</div>
            <div className="text-muted-foreground">Trade Efficiently</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">Secure</div>
            <div className="text-muted-foreground">Blockchain Powered</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Helios NFT Marketplace. Built on Helios Testnet.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
