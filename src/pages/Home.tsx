import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Shield, TrendingUp, Heart, BarChart3 } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";
import { SakuraAnimation } from "@/components/SakuraAnimation";
import { TrendingNFTs } from "@/components/TrendingNFTs";
import { MarketplaceStats } from "@/components/MarketplaceStats";
import heroImage from "@/assets/hero-sakura.jpg";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <img
          src={heroImage}
          alt="Sakura Winter"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 hero-gradient opacity-60" />
      </div>

      <SakuraAnimation />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 frost-glass border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary animate-float" />
              <h1 className="text-2xl font-bold text-gradient">Helios NFT</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/")}>
                Home
              </Button>
              <Button variant="ghost" onClick={() => navigate("/marketplace")}>
                Marketplace
              </Button>
              <Button variant="ghost" onClick={() => navigate("/collections")}>
                Collections
              </Button>
              <Button variant="ghost" onClick={() => navigate("/watchlist")}>
                <Heart className="h-4 w-4 mr-2" />
                Watchlist
              </Button>
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-gradient animate-float">
            Discover, Collect & Trade
            <br />
            Exclusive NFTs
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-2xl mx-auto">
            The premier marketplace for digital collectibles on Helios blockchain.
            Create, buy, and sell extraordinary NFTs.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="sakura-gradient text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate("/marketplace")}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Explore Marketplace
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 frost-glass"
              onClick={() => navigate("/mint")}
            >
              Create NFT
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12 relative z-10">
        <MarketplaceStats />
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 relative z-10">
        <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
          Why Choose Helios NFT?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-card card-hover p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full sakura-gradient flex items-center justify-center">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Ultra-low gas fees and instant transactions on Helios blockchain
            </p>
          </div>

          <div className="glass-card card-hover p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full sakura-gradient flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">100% Secure</h3>
            <p className="text-muted-foreground">
              Audited smart contracts ensuring the safety of your digital assets
            </p>
          </div>

          <div className="glass-card card-hover p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full sakura-gradient flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Track & Grow</h3>
            <p className="text-muted-foreground">
              Advanced analytics to track your collection's value and growth
            </p>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="container mx-auto px-4 py-16 relative z-10">
        <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
          Trending NFTs
        </h2>
        <TrendingNFTs />
        <div className="text-center mt-8">
          <Button
            size="lg"
            variant="outline"
            className="frost-glass"
            onClick={() => navigate("/marketplace")}
          >
            View All NFTs
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 mt-16 border-t border-white/20 frost-glass">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">Helios NFT</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The premier NFT marketplace on Helios blockchain
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Marketplace</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/marketplace" className="hover:text-primary transition-colors">Browse NFTs</a></li>
                <li><a href="/collections" className="hover:text-primary transition-colors">Collections</a></li>
                <li><a href="/mint" className="hover:text-primary transition-colors">Create</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/activity" className="hover:text-primary transition-colors">Activity</a></li>
                <li><a href="/watchlist" className="hover:text-primary transition-colors">Watchlist</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/profile" className="hover:text-primary transition-colors">My Profile</a></li>
                <li><a href="/watchlist" className="hover:text-primary transition-colors">My Watchlist</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-white/20">
            <p className="text-sm text-muted-foreground">
              © 2025 Helios NFT Marketplace • Powered by Helios Blockchain • Made with 🌸 and ❄️
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
