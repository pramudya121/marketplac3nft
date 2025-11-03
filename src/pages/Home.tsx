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
      <section className="container mx-auto px-4 py-24 md:py-32 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-block mb-6 px-4 py-2 rounded-full glass-card border border-primary/20">
            <span className="text-sm font-semibold text-gradient">Welcome to the Future of Digital Art</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-float">
            <span className="text-gradient">Discover, Collect</span>
            <br />
            <span className="text-gradient">& Trade NFTs</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            The premier NFT marketplace on Helios Testnet. Create, buy, sell, and discover unique digital assets in the most advanced decentralized platform.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/marketplace">
              <Button size="lg" className="gap-2 premium-gradient h-14 px-8 text-base font-semibold premium-button shadow-lg hover:shadow-primary text-white">
                <ShoppingBag className="w-5 h-5" />
                Explore Marketplace
              </Button>
            </Link>
            <Link to="/mint">
              <Button size="lg" variant="outline" className="gap-2 h-14 px-8 text-base font-semibold border-primary/30 hover:border-primary hover:bg-primary/10">
                <Palette className="w-5 h-5" />
                Mint Your NFT
              </Button>
            </Link>
            <Link to="/statistics">
              <Button size="lg" variant="outline" className="gap-2 h-14 px-8 text-base font-semibold border-secondary/30 hover:border-secondary hover:bg-secondary/10">
                <Activity className="w-5 h-5" />
                View Statistics
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose Helios NFT?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 card-hover card-gradient border border-border/50">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mb-6 shadow-primary">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Create NFTs</h3>
            <p className="text-muted-foreground leading-relaxed">
              Mint your unique digital assets on the Helios blockchain with just a few clicks. Low gas fees and instant confirmation.
            </p>
          </Card>

          <Card className="p-8 card-hover card-gradient border border-border/50">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center mb-6 shadow-secondary">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Trade & Collect</h3>
            <p className="text-muted-foreground leading-relaxed">
              Buy, sell, and make offers on NFTs in our secure marketplace with industry-leading low fees and instant transactions.
            </p>
          </Card>

          <Card className="p-8 card-hover card-gradient border border-border/50">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-6 shadow-secondary">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Track Activity</h3>
            <p className="text-muted-foreground leading-relaxed">
              Monitor all transactions and market activity in real-time on the blockchain with advanced analytics and insights.
            </p>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-20">
        <div className="glass-card border border-primary/10 rounded-3xl p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold text-gradient mb-3">100%</div>
              <div className="text-lg font-semibold">Decentralized</div>
              <div className="text-sm text-muted-foreground">True ownership on blockchain</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold text-gradient mb-3">Ultra Low</div>
              <div className="text-lg font-semibold">Gas Fees</div>
              <div className="text-sm text-muted-foreground">Trade efficiently on Helios</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold text-gradient mb-3">Secure</div>
              <div className="text-lg font-semibold">Smart Contracts</div>
              <div className="text-sm text-muted-foreground">Audited and battle-tested</div>
            </div>
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
