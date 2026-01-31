import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Star,
  MapPin,
  Users,
  Bed,
  Bath,
  Calendar,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Wifi,
  Car,
  Utensils,
  Tv,
  Snowflake,
  Loader2,
  User,
  Home,
  Zap
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import PublicLayout from "@/components/PublicLayout";
import { toast } from "sonner";

// Icon mapping for amenities
const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-5 w-5" />,
  car: <Car className="h-5 w-5" />,
  utensils: <Utensils className="h-5 w-5" />,
  tv: <Tv className="h-5 w-5" />,
  snowflake: <Snowflake className="h-5 w-5" />,
};

export default function AccommodationDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: accommodation, isLoading, error } = trpc.accommodations.bySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const { data: config } = trpc.config.get.useQuery();
  const currencySymbol = config?.currency_symbol || "€";

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.status === "confirmed" 
          ? "Buchung bestätigt!" 
          : "Anfrage gesendet!"
      );
      navigate(`/buchung/${data.id}/bestaetigung`);
    },
    onError: (error) => {
      toast.error(error.message || "Fehler bei der Buchung");
    },
  });

  // Calculate pricing
  const pricing = useMemo(() => {
    if (!accommodation || !checkIn || !checkOut) return null;
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return null;
    
    const pricePerNight = parseFloat(accommodation.pricePerNight);
    const cleaningFee = parseFloat(accommodation.cleaningFee || "0");
    const subtotal = pricePerNight * nights;
    const total = subtotal + cleaningFee;
    
    return { nights, pricePerNight, cleaningFee, subtotal, total };
  }, [accommodation, checkIn, checkOut]);

  const handleBooking = () => {
    if (!accommodation || !pricing) return;
    
    if (!guestName || !guestEmail) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    createBooking.mutate({
      accommodationId: accommodation.id,
      guestName,
      guestEmail,
      guestPhone: guestPhone || undefined,
      guestMessage: guestMessage || undefined,
      checkIn,
      checkOut,
      numberOfGuests: parseInt(guests),
    });
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !accommodation) {
    return (
      <PublicLayout>
        <div className="container max-w-4xl py-20 text-center">
          <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Unterkunft nicht gefunden</h1>
          <p className="text-muted-foreground mb-6">
            Die gesuchte Unterkunft existiert nicht oder wurde entfernt.
          </p>
          <Button onClick={() => navigate("/suche")}>Zurück zur Suche</Button>
        </div>
      </PublicLayout>
    );
  }

  const images = accommodation.images || [];
  const mainImage = images.find(img => img.isMain) || images[0];

  return (
    <PublicLayout>
      {/* Image Gallery */}
      <section className="bg-secondary/30">
        <div className="container max-w-7xl py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-xl overflow-hidden">
            {/* Main Image */}
            <div 
              className="md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto cursor-pointer relative group"
              onClick={() => { setCurrentImageIndex(0); setGalleryOpen(true); }}
            >
              <img
                src={mainImage?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"}
                alt={accommodation.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            
            {/* Additional Images */}
            {images.slice(1, 5).map((image, index) => (
              <div 
                key={image.id}
                className="hidden md:block aspect-[4/3] cursor-pointer relative group"
                onClick={() => { setCurrentImageIndex(index + 1); setGalleryOpen(true); }}
              >
                <img
                  src={image.url}
                  alt={`${accommodation.title} - Bild ${index + 2}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {index === 3 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold">+{images.length - 5} Fotos</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {images.length > 1 && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setGalleryOpen(true)}
            >
              Alle {images.length} Fotos anzeigen
            </Button>
          )}
        </div>
      </section>

      {/* Content */}
      <div className="container max-w-7xl py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Location */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-bold">{accommodation.title}</h1>
                {accommodation.averageRating && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{parseFloat(accommodation.averageRating).toFixed(1)}</span>
                  </div>
                )}
              </div>
              
              {(accommodation.city || accommodation.region) && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>{[accommodation.city, accommodation.region, accommodation.country].filter(Boolean).join(", ")}</span>
                </div>
              )}

              {accommodation.instantBooking && (
                <Badge className="mt-3 bg-primary">
                  <Zap className="h-3 w-3 mr-1" />
                  Sofortbuchung
                </Badge>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 py-4 border-y">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>{accommodation.maxGuests} Gäste</span>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-muted-foreground" />
                <span>{accommodation.bedrooms} Schlafzimmer</span>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-muted-foreground" />
                <span>{accommodation.beds} Betten</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-muted-foreground" />
                <span>{accommodation.bathrooms} Badezimmer</span>
              </div>
            </div>

            {/* Host Info */}
            {accommodation.host && (
              <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  {accommodation.host.avatarUrl ? (
                    <img src={accommodation.host.avatarUrl} alt={accommodation.host.name || ""} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="h-7 w-7 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">Gastgeber: {accommodation.host.name}</p>
                  {accommodation.host.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{accommodation.host.bio}</p>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {accommodation.description && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Über diese Unterkunft</h2>
                <p className="text-muted-foreground whitespace-pre-line">{accommodation.description}</p>
              </div>
            )}

            {/* Amenities */}
            {accommodation.amenities && accommodation.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Ausstattung</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {accommodation.amenities.map(amenity => (
                    <div key={amenity.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        {amenityIcons[amenity.icon || ""] || <Check className="h-5 w-5" />}
                      </div>
                      <span>{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* House Rules */}
            {(accommodation.checkInTime || accommodation.checkOutTime || accommodation.houseRules) && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Hausregeln</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>Check-in: ab {accommodation.checkInTime || "15:00"} Uhr</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>Check-out: bis {accommodation.checkOutTime || "11:00"} Uhr</span>
                  </div>
                  {accommodation.minNights && accommodation.minNights > 1 && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span>Mindestaufenthalt: {accommodation.minNights} Nächte</span>
                    </div>
                  )}
                  {accommodation.houseRules && (
                    <p className="text-muted-foreground mt-4">{accommodation.houseRules}</p>
                  )}
                </div>
              </div>
            )}

            {/* Reviews */}
            {accommodation.reviews && accommodation.reviews.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Bewertungen ({accommodation.reviews.length})
                </h2>
                <div className="space-y-4">
                  {accommodation.reviews.slice(0, 5).map(review => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} 
                              />
                            ))}
                          </div>
                          <span className="font-medium">{review.guestName}</span>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground">{review.comment}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking Box */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-baseline gap-2">
                  <span className="text-2xl">{currencySymbol}{parseFloat(accommodation.pricePerNight).toFixed(0)}</span>
                  <span className="text-muted-foreground font-normal text-base">/ Nacht</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">CHECK-IN</Label>
                    <Input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">CHECK-OUT</Label>
                    <Input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <Label className="text-xs">GÄSTE</Label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {[...Array(accommodation.maxGuests || 8)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? "Gast" : "Gäste"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Breakdown */}
                {pricing && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>{currencySymbol}{pricing.pricePerNight.toFixed(0)} x {pricing.nights} Nächte</span>
                      <span>{currencySymbol}{pricing.subtotal.toFixed(2)}</span>
                    </div>
                    {pricing.cleaningFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Reinigungsgebühr</span>
                        <span>{currencySymbol}{pricing.cleaningFee.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Gesamt</span>
                      <span>{currencySymbol}{pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Booking Button */}
                {showBookingForm ? (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Ihr vollständiger Name"
                      />
                    </div>
                    <div>
                      <Label>E-Mail *</Label>
                      <Input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="ihre@email.de"
                      />
                    </div>
                    <div>
                      <Label>Telefon</Label>
                      <Input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+49 123 456789"
                      />
                    </div>
                    <div>
                      <Label>Nachricht an den Gastgeber</Label>
                      <Textarea
                        value={guestMessage}
                        onChange={(e) => setGuestMessage(e.target.value)}
                        placeholder="Stellen Sie sich kurz vor oder teilen Sie besondere Wünsche mit..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setShowBookingForm(false)}
                      >
                        Zurück
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleBooking}
                        disabled={createBooking.isPending || !pricing}
                      >
                        {createBooking.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : accommodation.instantBooking ? (
                          "Jetzt buchen"
                        ) : (
                          "Anfrage senden"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setShowBookingForm(true)}
                    disabled={!pricing}
                  >
                    {accommodation.instantBooking ? "Jetzt buchen" : "Anfrage senden"}
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  {accommodation.instantBooking 
                    ? "Sofortige Bestätigung" 
                    : "Der Gastgeber wird Ihre Anfrage prüfen"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-5xl p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>
              Fotos ({currentImageIndex + 1} / {images.length})
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-[16/10] bg-black">
            {images.length > 0 && (
              <img
                src={images[currentImageIndex]?.url}
                alt={`${accommodation.title} - Bild ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
              />
            )}
            
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
