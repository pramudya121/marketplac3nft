import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FilterSortProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  filterBy?: string;
  onFilterChange?: (value: string) => void;
}

export const FilterSort = ({
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
}: FilterSortProps) => {
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <div className="flex-1 min-w-[200px]">
        <Label className="text-sm mb-2 block">Sort By</Label>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="frost-glass">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
            <SelectItem value="name_asc">Name: A to Z</SelectItem>
            <SelectItem value="name_desc">Name: Z to A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filterBy && onFilterChange && (
        <div className="flex-1 min-w-[200px]">
          <Label className="text-sm mb-2 block">Filter</Label>
          <Select value={filterBy} onValueChange={onFilterChange}>
            <SelectTrigger className="frost-glass">
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All NFTs</SelectItem>
              <SelectItem value="listed">Listed Only</SelectItem>
              <SelectItem value="unlisted">Not Listed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
