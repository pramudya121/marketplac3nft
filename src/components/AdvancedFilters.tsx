import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Slider } from "./ui/slider";
import { Filter, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";

interface FilterOptions {
  minPrice: string;
  maxPrice: string;
  searchQuery: string;
  hasOffers: boolean;
  isActive: boolean;
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export function AdvancedFilters({ onFilterChange }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: "",
    maxPrice: "",
    searchQuery: "",
    hasOffers: false,
    isActive: true
  });

  const handleApplyFilters = () => {
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    const resetFilters: FilterOptions = {
      minPrice: "",
      maxPrice: "",
      searchQuery: "",
      hasOffers: false,
      isActive: true
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Advanced Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filter NFTs</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search by Name</Label>
            <Input
              id="search"
              placeholder="Search NFT name..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            />
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <Label>Price Range (HLS)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPrice" className="text-sm text-muted-foreground">
                  Min Price
                </Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPrice" className="text-sm text-muted-foreground">
                  Max Price
                </Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="1000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Status Filters */}
          <div className="space-y-3">
            <Label>Status</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasOffers"
                checked={filters.hasOffers}
                onChange={(e) => setFilters({ ...filters, hasOffers: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="hasOffers" className="text-sm font-normal cursor-pointer">
                Has Active Offers
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                Active Listings Only
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleApplyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button onClick={handleResetFilters} variant="outline" className="gap-2">
              <X className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}