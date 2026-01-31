import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  Save, 
  Loader2,
  Upload,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import HostLayout from "@/components/HostLayout";
import { toast } from "sonner";
import { storagePut } from "@/lib/storage";

const ACCOMMODATION_TYPES = [
  { value: "apartment", label: "Wohnung" },
  { value: "house", label: "Haus" },
  { value: "room", label: "Zimmer" },
  { value: "villa", label: "Villa" },
  { value: "cabin", label: "Hütte/Ferienhaus" },
  { value: "other", label: "Sonstiges" },
];

export default function EditAccommodation() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [uploadingImages, setUploadingImages] = useState(false);
  const utils = trpc.useUtils();

  const { data: accommodation, isLoading } = trpc.accommodations.byId.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );

  const { data: amenities } = trpc.amenities.list.useQuery();
  const { data: accommodationAmenities } = trpc.accommodations.bySlug.useQuery(
    { slug: accommodation?.slug || "" },
    { enabled: !!accommodation?.slug }
  );
  const { data: config } = trpc.config.get.useQuery();
  const currencySymbol = config?.currency_symbol || "€";

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    accommodationType: "apartment",
    street: "",
    houseNumber: "",
    city: "",
    postalCode: "",
    country: "",
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
    isPublished: false,
    selectedAmenities: [] as number[],
  });

  useEffect(() => {
    if (accommodation) {
      setFormData({
        title: accommodation.title || "",
        shortDescription: accommodation.shortDescription || "",
        description: accommodation.description || "",
        accommodationType: accommodation.accommodationType || "apartment",
        street: accommodation.street || "",
        houseNumber: accommodation.houseNumber || "",
        city: accommodation.city || "",
        postalCode: accommodation.postalCode || "",
        country: accommodation.country || "",
        region: accommodation.region || "",
        maxGuests: accommodation.maxGuests || 2,
        bedrooms: accommodation.bedrooms || 1,
        beds: accommodation.beds || 1,
        bathrooms: accommodation.bathrooms || 1,
        pricePerNight: accommodation.pricePerNight || "80",
        weekendPrice: accommodation.weekendPrice || "",
        cleaningFee: accommodation.cleaningFee || "50",
        minNights: accommodation.minNights || 2,
        maxNights: accommodation.maxNights || 30,
        checkInTime: accommodation.checkInTime || "15:00",
        checkOutTime: accommodation.checkOutTime || "11:00",
        houseRules: accommodation.houseRules || "",
        instantBooking: accommodation.instantBooking || false,
        isPublished: accommodation.isPublished || false,
        selectedAmenities: accommodationAmenities?.amenities?.map(a => a.id) || [],
      });
    }
  }, [accommodation, accommodationAmenities]);

  const updateAccommodation = trpc.accommodations.update.useMutation({
    onSuccess: () => {
      utils.accommodations.byId.invalidate({ id: parseInt(id || "0") });
      utils.accommodations.myAccommodations.invalidate();
      toast.success("Änderungen gespeichert");
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Speichern");
    },
  });

  const setAmenities = trpc.accommodations.setAmenities.useMutation({
    onSuccess: () => {
      utils.accommodations.bySlug.invalidate({ slug: accommodation?.slug || "" });
    },
  });

  const addImage = trpc.images.add.useMutation({
    onSuccess: () => {
      utils.accommodations.byId.invalidate({ id: parseInt(id || "0") });
    },
  });

  const deleteImage = trpc.images.delete.useMutation({
    onSuccess: () => {
      utils.accommodations.byId.invalidate({ id: parseInt(id || "0") });
      toast.success("Bild gelöscht");
    },
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!id) return;
    
    updateAccommodation.mutate({
      id: parseInt(id),
      title: formData.title,
      shortDescription: formData.shortDescription || undefined,
      description: formData.description || undefined,
      accommodationType: formData.accommodationType as any,
      street: formData.street || undefined,
      houseNumber: formData.houseNumber || undefined,
      city: formData.city || undefined,
      postalCode: formData.postalCode || undefined,
      country: formData.country || undefined,
      region: formData.region || undefined,
      maxGuests: formData.maxGuests,
      bedrooms: formData.bedrooms,
      beds: formData.beds,
      bathrooms: formData.bathrooms,
      pricePerNight: formData.pricePerNight,
      weekendPrice: formData.weekendPrice || undefined,
      cleaningFee: formData.cleaningFee || undefined,
      minNights: formData.minNights,
      maxNights: formData.maxNights,
      checkInTime: formData.checkInTime || undefined,
      checkOutTime: formData.checkOutTime || undefined,
      houseRules: formData.houseRules || undefined,
      instantBooking: formData.instantBooking,
    });

    setAmenities.mutate({
      accommodationId: parseInt(id),
      amenityIds: formData.selectedAmenities,
    });
  };

  const togglePublished = () => {
    if (!id) return;
    updateAccommodation.mutate({
      id: parseInt(id),
      isPublished: !formData.isPublished,
    });
    setFormData(prev => ({ ...prev, isPublished: !prev.isPublished }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !id) return;
    
    setUploadingImages(true);
    const files = Array.from(e.target.files);
    
    try {
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const result = await storagePut(
          `accommodations/${id}/${Date.now()}-${file.name}`,
          buffer,
          file.type
        );
        
        await addImage.mutateAsync({
          accommodationId: parseInt(id),
          url: result.url,
          fileKey: result.key,
          isMain: !accommodation?.images?.length,
        });
      }
      toast.success("Bilder hochgeladen");
    } catch (error) {
      toast.error("Fehler beim Hochladen");
    } finally {
      setUploadingImages(false);
    }
  };

  if (isLoading) {
    return (
      <HostLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </HostLayout>
    );
  }

  if (!accommodation) {
    return (
      <HostLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold mb-2">Inserat nicht gefunden</h2>
          <Button onClick={() => navigate("/host/inserate")}>Zurück zur Übersicht</Button>
        </div>
      </HostLayout>
    );
  }

  return (
    <HostLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/host/inserate")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Inserat bearbeiten</h1>
              <p className="text-muted-foreground">{formData.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={togglePublished}>
              {formData.isPublished ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Offline nehmen
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Veröffentlichen
                </>
              )}
            </Button>
            <Button onClick={handleSave} disabled={updateAccommodation.isPending}>
              {updateAccommodation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Speichern
            </Button>
          </div>
        </div>

        <Tabs defaultValue="basic">
          <TabsList>
            <TabsTrigger value="basic">Basis</TabsTrigger>
            <TabsTrigger value="location">Adresse</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
            <TabsTrigger value="pricing">Preise</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Basisinformationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Titel</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
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
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Ausführliche Beschreibung</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Adresse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label>Straße</Label>
                    <Input
                      value={formData.street}
                      onChange={(e) => updateField("street", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Hausnummer</Label>
                    <Input
                      value={formData.houseNumber}
                      onChange={(e) => updateField("houseNumber", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>PLZ</Label>
                    <Input
                      value={formData.postalCode}
                      onChange={(e) => updateField("postalCode", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Stadt</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Region</Label>
                    <Input
                      value={formData.region}
                      onChange={(e) => updateField("region", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Land</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => updateField("country", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Details & Ausstattung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Fotos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                  </label>
                </div>

                {accommodation.images && accommodation.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {accommodation.images.map((image, index) => (
                      <div key={image.id} className="relative aspect-[4/3] rounded-lg overflow-hidden group">
                        <img
                          src={image.url}
                          alt={`Bild ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {image.isMain && (
                          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Hauptbild
                          </span>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteImage.mutate({ id: image.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Preise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preis pro Nacht</Label>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </HostLayout>
  );
}
