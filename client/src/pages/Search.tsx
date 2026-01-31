import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Search as SearchIcon, 
  SlidersHorizontal, 
  MapPin, 
  Calendar,
  Users,
  X,
  Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import PublicLayout from "@/components/PublicLayout";
import AccommodationCard from "@/components/AccommodationCard";

export default function Search() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  
  const [city, setCity] = useState(params.get("city") || "");
  const [checkIn, setCheckIn] = useState(params.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(params.get("checkOut") || "");
  const [guests, setGuests] = useState(params.get("guests") || "2");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "rating">("newest");
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);

  const { data: accommodations, isLoading } = trpc.accommodations.search.useQuery({
    city: city || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 500 ? priceRange[1] : undefined,
    minGuests: parseInt(guests) || undefined,
    amenityIds: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    sortBy,
  });

  const { data: amenities } = trpc.amenities.list.useQuery();

  const toggleAmenity = (id: number) => {
    setSelectedAmenities(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setCity("");
    setCheckIn("");
    setCheckOut("");
    setGuests("2");
    setPriceRange([0, 500]);
    setSelectedAmenities([]);
    setSortBy("newest");
  };

  const hasActiveFilters = city || priceRange[0] > 0 || priceRange[1] < 500 || selectedAmenities.length > 0;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Preis pro Nacht</Label>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          min={0}
          max={500}
          step={10}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>€{priceRange[0]}</span>
          <span>€{priceRange[1]}+</span>
        </div>
      </div>

      {/* Guests */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Anzahl Gäste</Label>
        <Select value={guests} onValueChange={setGuests}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => (
              <SelectItem key={n} value={n.toString()}>
                {n}+ Gäste
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amenities */}
      {amenities && amenities.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-3 block">Ausstattung</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {amenities.slice(0, 10).map(amenity => (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity.id}`}
                  checked={selectedAmenities.includes(amenity.id)}
                  onCheckedChange={() => toggleAmenity(amenity.id)}
                />
                <label
                  htmlFor={`amenity-${amenity.id}`}
                  className="text-sm cursor-pointer"
                >
                  {amenity.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Filter zurücksetzen
        </Button>
      )}
    </div>
  );

  return (
    <PublicLayout>
      <div className="bg-secondary/30 border-b">
        <div className="container max-w-7xl py-6">
          {/* Search Bar */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Stadt oder Region"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="pl-10 h-12 bg-white"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="pl-10 h-12 w-40 bg-white"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="pl-10 h-12 w-40 bg-white"
              />
            </div>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="h-12 pl-10 pr-4 rounded-md border border-input bg-white text-foreground w-32"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n} Gäste</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl py-8">
        <div className="flex gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Filter</h3>
                <FilterContent />
              </CardContent>
            </Card>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">
                  {city ? `Unterkünfte in ${city}` : "Alle Unterkünfte"}
                </h1>
                <p className="text-muted-foreground">
                  {isLoading ? "Suche..." : `${accommodations?.length || 0} Ergebnisse`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Filter
                      {hasActiveFilters && (
                        <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                          !
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filter</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Sortieren" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Neueste zuerst</SelectItem>
                    <SelectItem value="price_asc">Preis aufsteigend</SelectItem>
                    <SelectItem value="price_desc">Preis absteigend</SelectItem>
                    <SelectItem value="rating">Beste Bewertung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : accommodations && accommodations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {accommodations.map(accommodation => (
                  <AccommodationCard key={accommodation.id} accommodation={accommodation} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Keine Unterkünfte gefunden</h3>
                <p className="text-muted-foreground mb-4">
                  Versuchen Sie, Ihre Suchkriterien anzupassen oder Filter zu entfernen.
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Filter zurücksetzen
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
