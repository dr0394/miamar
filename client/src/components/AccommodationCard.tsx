import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Users, Bed } from "lucide-react";

interface AccommodationImage {
  id: number;
  url: string;
  isMain: boolean | null;
}

interface AccommodationCardProps {
  accommodation: {
    id: number;
    slug: string;
    title: string;
    shortDescription?: string | null;
    city?: string | null;
    region?: string | null;
    pricePerNight: string;
    maxGuests?: number | null;
    bedrooms?: number | null;
    averageRating?: string | null;
    instantBooking?: boolean | null;
    images?: AccommodationImage[];
  };
}

export default function AccommodationCard({ accommodation }: AccommodationCardProps) {
  const mainImage = accommodation.images?.find(img => img.isMain) || accommodation.images?.[0];
  const imageUrl = mainImage?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";

  return (
    <Link href={`/unterkunft/${accommodation.slug}`}>
      <Card className="card-hover overflow-hidden cursor-pointer group">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={accommodation.title}
            className="w-full h-full object-cover img-zoom"
          />
          {accommodation.instantBooking && (
            <Badge className="absolute top-3 left-3 bg-primary">
              Sofortbuchung
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {accommodation.title}
            </h3>
            {accommodation.averageRating && (
              <div className="flex items-center gap-1 text-sm shrink-0">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>{parseFloat(accommodation.averageRating).toFixed(1)}</span>
              </div>
            )}
          </div>
          
          {(accommodation.city || accommodation.region) && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
              <MapPin className="h-4 w-4" />
              <span>{[accommodation.city, accommodation.region].filter(Boolean).join(", ")}</span>
            </div>
          )}

          <div className="flex items-center gap-4 text-muted-foreground text-sm mb-3">
            {accommodation.maxGuests && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{accommodation.maxGuests} Gäste</span>
              </div>
            )}
            {accommodation.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{accommodation.bedrooms} Schlafzimmer</span>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold">€{parseFloat(accommodation.pricePerNight).toFixed(0)}</span>
            <span className="text-muted-foreground text-sm">/ Nacht</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
