import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  MapPin, 
  Users, 
  Euro, 
  Image as ImageIcon,
  Check,
  Loader2,
  Upload,
  X
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import HostLayout from "@/components/HostLayout";
import { toast } from "sonner";
import { storagePut } from "@/lib/storage";

const STEPS = [
  { id: 1, title: "Basisinformationen", icon: Home },
  { id: 2, title: "Adresse", icon: MapPin },
  { id: 3, title: "Details", icon: Users },
  { id: 4, title: "Fotos", icon: ImageIcon },
  { id: 5, title: "Preise", icon: Euro },
  { id: 6, title: "Veröffentlichen", icon: Check },
];

const ACCOMMODATION_TYPES = [
  { value: "apartment", label: "Wohnung" },
  { value: "house", label: "Haus" },
  { value: "room", label: "Zimmer" },
  { value: "villa", label: "Villa" },
  { value: "cabin", label: "Hütte/Ferienhaus" },
  { value: "other", label: "Sonstiges" },
];

export default function CreateAccommodation() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [accommodationId, setAccommodationId] = useState<number | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{ id?: number; url: string; fileKey?: string }>>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    accommodationType: "apartment" as const,
    street: "",
    houseNumber: "",
    city: "",
    postalCode: "",
    country: "Deutschland",
    region: "",
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    pricePerNight: "80",
    weekendPrice: "",
    cleaningFee: "50",
    minNights: 2,
    maxNights: 30,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    houseRules: "",
    instantBooking: false,
    selectedAmenities: [] as number[],
  });

  const { data: amenities } = trpc.amenities.list.useQuery();
  const { data: config } = trpc.config.get.useQuery();
  const currencySymbol = config?.currency_symbol || "€";

  const createAccommodation = trpc.accommodations.create.useMutation({
    onSuccess: (data) => {
      setAccommodationId(data.id);
      toast.success("Inserat erstellt");
      setCurrentStep(2);
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Erstellen");
    },
  });

  const updateAccommodation = trpc.accommodations.update.useMutation({
    onSuccess: () => {
      toast.success("Änderungen gespeichert");
      setCurrentStep(prev => prev + 1);
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Speichern");
    },
  });

  const setAmenities = trpc.accommodations.setAmenities.useMutation();
  const addImage = trpc.images.add.useMutation();

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!formData.title || formData.title.length < 5) {
        toast.error("Bitte geben Sie einen Titel ein (min. 5 Zeichen)");
        return;
      }
      
      createAccommodation.mutate({
        title: formData.title,
        shortDescription: formData.shortDescription || undefined,
        description: formData.description || undefined,
        accommodationType: formData.accommodationType,
        pricePerNight: formData.pricePerNight,
      });
    } else if (currentStep === 2 && accommodationId) {
      updateAccommodation.mutate({
        id: accommodationId,
        street: formData.street || undefined,
        houseNumber: formData.houseNumber || undefined,
        city: formData.city || undefined,
        postalCode: formData.postalCode || undefined,
        country: formData.country || undefined,
        region: formData.region || undefined,
      });
    } else if (currentStep === 3 && accommodationId) {
      updateAccommodation.mutate({
        id: accommodationId,
        maxGuests: formData.maxGuests,
        bedrooms: formData.bedrooms,
        beds: formData.beds,
        bathrooms: formData.bathrooms,
        checkInTime: formData.checkInTime || undefined,
        checkOutTime: formData.checkOutTime || undefined,
        minNights: formData.minNights,
        maxNights: formData.maxNights,
        houseRules: formData.houseRules || undefined,
      });
      
      if (formData.selectedAmenities.length > 0) {
        setAmenities.mutate({
          accommodationId,
          amenityIds: formData.selectedAmenities,
        });
      }
    } else if (currentStep === 4) {
      setCurrentStep(5);
    } else if (currentStep === 5 && accommodationId) {
      updateAccommodation.mutate({
        id: accommodationId,
        pricePerNight: formData.pricePerNight,
        weekendPrice: formData.weekendPrice || undefined,
        cleaningFee: formData.cleaningFee || undefined,
        instantBooking: formData.instantBooking,
      });
    } else if (currentStep === 6 && accommodationId) {
      updateAccommodation.mutate({
        id: accommodationId,
        isPublished: true,
      });
      toast.success("Inserat veröffentlicht!");
      navigate("/host/inserate");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !accommodationId) return;
    
    setUploadingImages(true);
    const files = Array.from(e.target.files);
    
    try {
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const result = await storagePut(
          `accommodations/${accommodationId}/${Date.now()}-${file.name}`,
          new Uint8Array(buffer),
          file.type
        );
        
        const imageResult = await addImage.mutateAsync({
          accommodationId,
          url: result.url,
          fileKey: result.key,
          isMain: uploadedImages.length === 0,
        });
        
        setUploadedImages(prev => [...prev, { id: imageResult.id, url: result.url, fileKey: result.key }]);
      }
      toast.success("Bilder hochgeladen");
    } catch (error) {
      toast.error("Fehler beim Hochladen");
    } finally {
      setUploadingImages(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <HostLayout>
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Schritt {currentStep} von {STEPS.length}
            </span>
            <span className="text-sm font-medium">{STEPS[currentStep - 1].title}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const StepIcon = STEPS[currentStep - 1].icon;
                return <StepIcon className="h-5 w-5" />;
              })()}
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Beschreiben Sie Ihre Unterkunft"}
              {currentStep === 2 && "Wo befindet sich Ihre Unterkunft?"}
              {currentStep === 3 && "Details und Ausstattung"}
              {currentStep === 4 && "Laden Sie Fotos hoch"}
              {currentStep === 5 && "Legen Sie Ihre Preise fest"}
              {currentStep === 6 && "Überprüfen und veröffentlichen"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <div>
                  <Label>Titel *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="z.B. Gemütliche Ferienwohnung mit Bergblick"
                  />
                </div>
                <div>
                  <Label>Art der Unterkunft</Label>
                  <Select
                    value={formData.accommodationType}
                    onValueChange={(v) => updateField("accommodationType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOMMODATION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kurzbeschreibung</Label>
                  <Textarea
                    value={formData.shortDescription}
                    onChange={(e) => updateField("shortDescription", e.target.value)}
                    placeholder="Eine kurze Zusammenfassung (wird in Suchergebnissen angezeigt)"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Ausführliche Beschreibung</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Beschreiben Sie Ihre Unterkunft ausführlich..."
                    rows={5}
                  />
                </div>
              </>
            )}

            {/* Step 2: Address */}
            {currentStep === 2 && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label>Straße</Label>
                    <Input
                      value={formData.street}
                      onChange={(e) => updateField("street", e.target.value)}
                      placeholder="Musterstraße"
                    />
                  </div>
                  <div>
                    <Label>Hausnummer</Label>
                    <Input
                      value={formData.houseNumber}
                      onChange={(e) => updateField("houseNumber", e.target.value)}
                      placeholder="12a"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>PLZ</Label>
                    <Input
                      value={formData.postalCode}
                      onChange={(e) => updateField("postalCode", e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <Label>Stadt</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="Berlin"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Region</Label>
                    <Input
                      value={formData.region}
                      onChange={(e) => updateField("region", e.target.value)}
                      placeholder="z.B. Bayern, Schwarzwald"
                    />
                  </div>
                  <div>
                    <Label>Land</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => updateField("country", e.target.value)}
                      placeholder="Deutschland"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Details */}
            {currentStep === 3 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Max. Gäste</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.maxGuests}
                      onChange={(e) => updateField("maxGuests", parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Schlafzimmer</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.bedrooms}
                      onChange={(e) => updateField("bedrooms", parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Betten</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.beds}
                      onChange={(e) => updateField("beds", parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Badezimmer</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.bathrooms}
                      onChange={(e) => updateField("bathrooms", parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Check-in Zeit</Label>
                    <Input
                      type="time"
                      value={formData.checkInTime}
                      onChange={(e) => updateField("checkInTime", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Check-out Zeit</Label>
                    <Input
                      type="time"
                      value={formData.checkOutTime}
                      onChange={(e) => updateField("checkOutTime", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min. Nächte</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.minNights}
                      onChange={(e) => updateField("minNights", parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Max. Nächte</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.maxNights}
                      onChange={(e) => updateField("maxNights", parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {amenities && amenities.length > 0 && (
                  <div>
                    <Label className="mb-3 block">Ausstattung</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {amenities.map(amenity => (
                        <div key={amenity.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`amenity-${amenity.id}`}
                            checked={formData.selectedAmenities.includes(amenity.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateField("selectedAmenities", [...formData.selectedAmenities, amenity.id]);
                              } else {
                                updateField("selectedAmenities", formData.selectedAmenities.filter(id => id !== amenity.id));
                              }
                            }}
                          />
                          <label htmlFor={`amenity-${amenity.id}`} className="text-sm cursor-pointer">
                            {amenity.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Hausregeln</Label>
                  <Textarea
                    value={formData.houseRules}
                    onChange={(e) => updateField("houseRules", e.target.value)}
                    placeholder="z.B. Keine Haustiere, Nichtraucher..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Step 4: Photos */}
            {currentStep === 4 && (
              <>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImages}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {uploadingImages ? (
                      <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                    ) : (
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    )}
                    <p className="font-medium mb-1">
                      {uploadingImages ? "Wird hochgeladen..." : "Klicken zum Hochladen"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      oder Dateien hierher ziehen
                    </p>
                  </label>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative aspect-[4/3] rounded-lg overflow-hidden">
                        <img
                          src={image.url}
                          alt={`Bild ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === 0 && (
                          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Hauptbild
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 5: Pricing */}
            {currentStep === 5 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preis pro Nacht *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        min={1}
                        value={formData.pricePerNight}
                        onChange={(e) => updateField("pricePerNight", e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Wochenendpreis (optional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        min={1}
                        value={formData.weekendPrice}
                        onChange={(e) => updateField("weekendPrice", e.target.value)}
                        className="pl-8"
                        placeholder="Wie Standardpreis"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Reinigungsgebühr (einmalig)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {currencySymbol}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={formData.cleaningFee}
                      onChange={(e) => updateField("cleaningFee", e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-4 bg-secondary/30 rounded-lg">
                  <Checkbox
                    id="instant-booking"
                    checked={formData.instantBooking}
                    onCheckedChange={(checked) => updateField("instantBooking", checked)}
                  />
                  <div>
                    <label htmlFor="instant-booking" className="font-medium cursor-pointer">
                      Sofortbuchung aktivieren
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Gäste können sofort buchen, ohne auf Ihre Bestätigung zu warten
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Step 6: Publish */}
            {currentStep === 6 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Bereit zur Veröffentlichung!</h3>
                <p className="text-muted-foreground mb-6">
                  Ihr Inserat "{formData.title}" ist bereit. Klicken Sie auf "Veröffentlichen", 
                  um es für Gäste sichtbar zu machen.
                </p>
                <div className="bg-secondary/30 rounded-lg p-4 text-left max-w-md mx-auto">
                  <h4 className="font-medium mb-2">Zusammenfassung:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• {formData.accommodationType === "apartment" ? "Wohnung" : formData.accommodationType}</li>
                    <li>• {formData.city || "Keine Stadt angegeben"}</li>
                    <li>• {formData.maxGuests} Gäste, {formData.bedrooms} Schlafzimmer</li>
                    <li>• {currencySymbol}{formData.pricePerNight} pro Nacht</li>
                    <li>• {uploadedImages.length} Fotos</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => currentStep > 1 ? setCurrentStep(prev => prev - 1) : navigate("/host/inserate")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {currentStep === 1 ? "Abbrechen" : "Zurück"}
          </Button>
          <Button
            onClick={handleNext}
            disabled={createAccommodation.isPending || updateAccommodation.isPending}
          >
            {(createAccommodation.isPending || updateAccommodation.isPending) ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {currentStep === 6 ? "Veröffentlichen" : "Weiter"}
            {currentStep < 6 && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </HostLayout>
  );
}
