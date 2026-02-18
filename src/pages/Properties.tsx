import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function Properties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [propertyType, setPropertyType] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    let query = supabase.from("properties").select("*").eq("is_available", true).order("created_at", { ascending: false });
    const { data } = await query;
    setProperties(data || []);
    setLoading(false);
  };

  const filteredProperties = properties.filter((p) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      !search ||
      p.title?.toLowerCase().includes(searchLower) ||
      p.city?.toLowerCase().includes(searchLower) ||
      p.address?.toLowerCase().includes(searchLower) ||
      p.state?.toLowerCase().includes(searchLower);
    const matchMin = !minPrice || p.price >= Number(minPrice);
    const matchMax = !maxPrice || p.price <= Number(maxPrice);
    const matchType = !propertyType || p.property_type === propertyType;
    return matchSearch && matchMin && matchMax && matchType;
  });

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setPropertyType("");
  };

  const hasFilters = search || minPrice || maxPrice || propertyType;

  const TYPES = ["apartment", "house", "studio", "villa", "condo"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero py-10">
        <div className="page-container text-center">
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">Browse Properties</h1>
          <p className="text-primary-foreground/80">Find your perfect home from our verified listings</p>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Search + Filter Bar */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-card mb-6">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by city, address, title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters {hasFilters && <span className="w-2 h-2 bg-primary rounded-full" />}
            </Button>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive">
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border grid sm:grid-cols-3 gap-4 animate-fade-in">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Price ($/mo)</label>
                <Input type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Price ($/mo)</label>
                <Input type="number" placeholder="10000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Property Type</label>
                <select
                  className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <p className="text-muted-foreground text-sm mb-4">
          {loading ? "Loading..." : `${filteredProperties.length} propert${filteredProperties.length !== 1 ? "ies" : "y"} found`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏠</div>
            <h3 className="font-semibold text-lg mb-2">No properties found</h3>
            <p className="text-muted-foreground">Try adjusting your search filters</p>
            {hasFilters && <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
