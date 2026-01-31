import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronLeft, 
  Calendar, 
  Users, 
  Euro, 
  Loader2,
  Mail,
  Phone,
  Check,
  X,
  MessageSquare
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import HostLayout from "@/components/HostLayout";
import { format, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";

const STATUS_CONFIG = {
  pending: { label: "Anfrage", className: "status-pending" },
  confirmed: { label: "Bestätigt", className: "status-confirmed" },
  rejected: { label: "Abgelehnt", className: "status-rejected" },
  cancelled: { label: "Storniert", className: "status-rejected" },
  completed: { label: "Abgeschlossen", className: "status-completed" },
};

export default function HostBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const utils = trpc.useUtils();

  const { data: booking, isLoading } = trpc.bookings.byId.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );

  const { data: config } = trpc.config.get.useQuery();
  const currencySymbol = config?.currency_symbol || "€";

  const confirmBooking = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      utils.bookings.byId.invalidate({ id: parseInt(id || "0") });
      utils.bookings.myBookings.invalidate();
      toast.success("Buchung bestätigt");
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Bestätigen");
    },
  });

  const rejectBooking = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      utils.bookings.byId.invalidate({ id: parseInt(id || "0") });
      utils.bookings.myBookings.invalidate();
      toast.success("Buchung abgelehnt");
      setShowRejectForm(false);
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Ablehnen");
    },
  });

  const completeBooking = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      utils.bookings.byId.invalidate({ id: parseInt(id || "0") });
      utils.bookings.myBookings.invalidate();
      toast.success("Buchung als abgeschlossen markiert");
    },
    onError: (error) => {
      toast.error(error.message || "Fehler");
    },
  });

  if (isLoading) {
    return (
      <HostLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </HostLayout>
    );
  }

  if (!booking) {
    return (
      <HostLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold mb-2">Buchung nicht gefunden</h2>
          <Button onClick={() => navigate("/host/buchungen")}>Zurück zur Übersicht</Button>
        </div>
      </HostLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const nights = differenceInDays(new Date(booking.checkOut), new Date(booking.checkIn));

  return (
    <HostLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/host/buchungen")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Buchung #{booking.id}</h1>
                <Badge className={statusConfig.className}>
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Erstellt am {format(new Date(booking.createdAt), "dd. MMMM yyyy", { locale: de })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Info */}
            <Card>
              <CardHeader>
                <CardTitle>Gast-Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">
                      {booking.guestName?.charAt(0) || "G"}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{booking.guestName}</p>
                    <p className="text-sm text-muted-foreground">{booking.numberOfGuests} Gäste</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">E-Mail</p>
                      <p className="font-medium">{booking.guestEmail}</p>
                    </div>
                  </div>
                  {booking.guestPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Telefon</p>
                        <p className="font-medium">{booking.guestPhone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {booking.guestMessage && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Nachricht des Gastes</p>
                      </div>
                      <p className="bg-secondary/30 p-4 rounded-lg">{booking.guestMessage}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle>Buchungsdetails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Check-in</p>
                    <p className="font-semibold">
                      {format(new Date(booking.checkIn), "EEEE, dd. MMMM yyyy", { locale: de })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check-out</p>
                    <p className="font-semibold">
                      {format(new Date(booking.checkOut), "EEEE, dd. MMMM yyyy", { locale: de })}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span>Anzahl Nächte</span>
                  <span className="font-medium">{nights}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Anzahl Gäste</span>
                  <span className="font-medium">{booking.numberOfGuests}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {booking.status === "pending" && (
              <Card>
                <CardHeader>
                  <CardTitle>Aktionen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showRejectForm ? (
                    <div className="flex gap-4">
                      <Button
                        className="flex-1"
                        onClick={() => confirmBooking.mutate({ id: booking.id, status: "confirmed" })}
                        disabled={confirmBooking.isPending}
                      >
                        {confirmBooking.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Bestätigen
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowRejectForm(true)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Ablehnen
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Grund für die Ablehnung (optional)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-4">
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => rejectBooking.mutate({ id: booking.id, status: "rejected" })}
                          disabled={rejectBooking.isPending}
                        >
                          {rejectBooking.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <X className="mr-2 h-4 w-4" />
                          )}
                          Ablehnung bestätigen
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowRejectForm(false)}
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {booking.status === "confirmed" && new Date(booking.checkOut) < new Date() && (
              <Card>
                <CardContent className="p-4">
                  <Button
                    className="w-full"
                    onClick={() => completeBooking.mutate({ id: booking.id, status: "completed" })}
                    disabled={completeBooking.isPending}
                  >
                    {completeBooking.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Als abgeschlossen markieren
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Accommodation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Unterkunft</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <img
                    src={(booking.accommodation as any)?.images?.[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80"}
                    alt={booking.accommodation?.title || "Unterkunft"}
                    className="w-full aspect-video rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium">{booking.accommodation?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.accommodation?.city}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preisübersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{currencySymbol}{parseFloat(booking.accommodation?.pricePerNight || "0").toFixed(2)} x {nights} Nächte</span>
                  <span>{currencySymbol}{(parseFloat(booking.accommodation?.pricePerNight || "0") * nights).toFixed(2)}</span>
                </div>
                {booking.accommodation?.cleaningFee && parseFloat(booking.accommodation.cleaningFee) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Reinigungsgebühr</span>
                    <span>{currencySymbol}{parseFloat(booking.accommodation.cleaningFee).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Gesamt</span>
                  <span>{currencySymbol}{parseFloat(booking.totalPrice).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </HostLayout>
  );
}
