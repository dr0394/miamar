import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Users, 
  Euro, 
  Loader2,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import HostLayout from "@/components/HostLayout";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  pending: { label: "Anfrage", className: "status-pending" },
  confirmed: { label: "Bestätigt", className: "status-confirmed" },
  rejected: { label: "Abgelehnt", className: "status-rejected" },
  cancelled: { label: "Storniert", className: "status-rejected" },
  completed: { label: "Abgeschlossen", className: "status-completed" },
};

export default function HostBookings() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("pending");

  const { data: pendingBookings, isLoading: pendingLoading } = trpc.bookings.myBookings.useQuery({ status: "pending" });
  const { data: confirmedBookings, isLoading: confirmedLoading } = trpc.bookings.myBookings.useQuery({ status: "confirmed" });
  const { data: completedBookings, isLoading: completedLoading } = trpc.bookings.myBookings.useQuery({ status: "completed" });
  const { data: allBookings, isLoading: allLoading } = trpc.bookings.myBookings.useQuery({});

  const { data: config } = trpc.config.get.useQuery();
  const currencySymbol = config?.currency_symbol || "€";

  const getBookingsForTab = () => {
    switch (activeTab) {
      case "pending": return { data: pendingBookings, loading: pendingLoading };
      case "confirmed": return { data: confirmedBookings, loading: confirmedLoading };
      case "completed": return { data: completedBookings, loading: completedLoading };
      default: return { data: allBookings, loading: allLoading };
    }
  };

  const { data: bookings, loading } = getBookingsForTab();

  const BookingCard = ({ booking }: { booking: NonNullable<typeof bookings>[number] }) => {
    const statusConfig = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(`/host/buchungen/${booking.id}`)}
      >
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Accommodation Image */}
            <div className="md:w-40 h-32 md:h-auto shrink-0">
              <img
                src={(booking.accommodation as any)?.images?.[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80"}
                alt={booking.accommodation?.title || "Unterkunft"}
                className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
              />
            </div>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{booking.guestName}</h3>
                    <Badge className={statusConfig.className}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {booking.accommodation?.title}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(booking.checkIn), "dd. MMM", { locale: de })} - {format(new Date(booking.checkOut), "dd. MMM yyyy", { locale: de })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.numberOfGuests} Gäste</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{currencySymbol}{parseFloat(booking.totalPrice).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <HostLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Buchungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Buchungsanfragen und bestätigten Reservierungen
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Anfragen
              {pendingBookings && pendingBookings.length > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingBookings.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed">Bestätigt</TabsTrigger>
            <TabsTrigger value="completed">Abgeschlossen</TabsTrigger>
            <TabsTrigger value="all">Alle</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {activeTab === "pending" && "Keine neuen Anfragen"}
                  {activeTab === "confirmed" && "Keine bestätigten Buchungen"}
                  {activeTab === "completed" && "Keine abgeschlossenen Buchungen"}
                  {activeTab === "all" && "Noch keine Buchungen"}
                </h3>
                <p className="text-muted-foreground">
                  {activeTab === "pending" 
                    ? "Neue Buchungsanfragen werden hier angezeigt."
                    : "Buchungen werden hier angezeigt, sobald welche vorhanden sind."
                  }
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </HostLayout>
  );
}
