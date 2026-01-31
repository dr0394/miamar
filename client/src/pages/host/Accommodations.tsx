import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Eye, 
  EyeOff, 
  Trash2,
  MapPin,
  Users,
  Euro,
  Loader2,
  Home
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import HostLayout from "@/components/HostLayout";
import { toast } from "sonner";

export default function HostAccommodations() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: accommodations, isLoading } = trpc.accommodations.myAccommodations.useQuery();
  const { data: config } = trpc.config.get.useQuery();
  const currencySymbol = config?.currency_symbol || "€";

  const updateAccommodation = trpc.accommodations.update.useMutation({
    onSuccess: () => {
      utils.accommodations.myAccommodations.invalidate();
      toast.success("Inserat aktualisiert");
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Aktualisieren");
    },
  });

  const togglePublished = (id: number, currentStatus: boolean) => {
    updateAccommodation.mutate({
      id,
      isPublished: !currentStatus,
    });
  };

  return (
    <HostLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meine Inserate</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Unterkünfte
            </p>
          </div>
          <Button onClick={() => navigate("/host/inserate/neu")}>
            <Plus className="mr-2 h-4 w-4" />
            Neues Inserat
          </Button>
        </div>

        {/* Accommodations List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : accommodations && accommodations.length > 0 ? (
          <div className="grid gap-4">
            {accommodations.map(accommodation => (
              <Card key={accommodation.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-48 h-48 md:h-auto shrink-0">
                      <img
                        src={accommodation.images?.[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80"}
                        alt={accommodation.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{accommodation.title}</h3>
                            <Badge variant={accommodation.isPublished ? "default" : "secondary"}>
                              {accommodation.isPublished ? "Online" : "Entwurf"}
                            </Badge>
                          </div>
                          
                          {accommodation.city && (
                            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                              <MapPin className="h-4 w-4" />
                              <span>{[accommodation.city, accommodation.region].filter(Boolean).join(", ")}</span>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{accommodation.maxGuests} Gäste</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Euro className="h-4 w-4 text-muted-foreground" />
                              <span>{currencySymbol}{parseFloat(accommodation.pricePerNight).toFixed(0)} / Nacht</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/host/inserate/${accommodation.id}/bearbeiten`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePublished(accommodation.id, accommodation.isPublished || false)}>
                              {accommodation.isPublished ? (
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
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => window.open(`/unterkunft/${accommodation.slug}`, "_blank")}
                              disabled={!accommodation.isPublished}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Vorschau
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Noch keine Inserate</h3>
            <p className="text-muted-foreground mb-6">
              Erstellen Sie Ihr erstes Inserat und beginnen Sie, Gäste zu empfangen.
            </p>
            <Button onClick={() => navigate("/host/inserate/neu")}>
              <Plus className="mr-2 h-4 w-4" />
              Erstes Inserat erstellen
            </Button>
          </Card>
        )}
      </div>
    </HostLayout>
  );
}
