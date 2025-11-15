import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import MintNFT from "./pages/MintNFT";
import Activity from "./pages/Activity";
import Profile from "./pages/Profile";
import MyProfile from "./pages/MyProfile";
import Collections from "./pages/Collections";
import Watchlist from "./pages/Watchlist";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/index" element={<Index />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/mint" element={<MintNFT />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/profile/:address" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
