import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Euro, 
  MessageSquare, 
  Calendar, 
  TrendingUp,
  Plus,
  ArrowRight,
  Home,
  Clock,
  Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
// Auth redirect to /login
import HostLayout from "@/components/HostLayout";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function HostDashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Redirect if not authenticated or not a host
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === "host" || user?.role === "admin") }
  );

  const { data: pendingBookings, isLoading: bookingsLoading } = trpc.bookings.myBookings.useQuery(
    { status: "pending" },
    { enabled: isAuthenticated && (user?.role === "host" || user?.role === "admin") }
  );

  const { data: upcomingCheckIns, isLoading: checkInsLoading } = trpc.bookings.upcomingCheckIns.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === "host" || user?.role === "admin") }
  );

  const { data: accommodations, isLoading: accommodationsLoading } = trpc.accommodations.myAccommodations.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === "host" || user?.role === "admin") }
  );

  const { data: config } = trpc.config.get.useQuery();
  const currencySymbol = config?.currency_symbol || "€";

  const becomeHost = trpc.auth.becomeHost.useMutation({
    onSuccess: () => {
      window.location.reload();
    }
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show upgrade prompt for regular users
  if (user && user.role === "user") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Home className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Werden Sie Gastgeber</h1>
            <p className="text-muted-foreground mb-6">
              Möchten Sie Ihre Unterkunft auf unserer Plattform anbieten? 
              Aktivieren Sie jetzt Ihr Gastgeber-Konto.
            </p>
            <Button 
              onClick={() => becomeHost.mutate()}
              disabled={becomeHost.isPending}
            >
              {becomeHost.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Gastgeber werden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <HostLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Willkommen zurück, {user?.name || "Gastgeber"}!
            </p>
          </div>
          <Button onClick={() => navigate("/host/inserate/neu")}>
            <Plus className="mr-2 h-4 w-4" />
            Neues Inserat
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Umsatz (gesamt)</p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "..." : `${currencySymbol}${(stats?.totalRevenue || 0).toFixed(0)}`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Euro className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Neue Anfragen</p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "..." : stats?.pendingRequests || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bestätigte Buchungen</p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "..." : stats?.confirmedBookings || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Inserate</p>
                  <p className="text-2xl font-bold">
                    {accommodationsLoading ? "..." : accommodations?.filter(a => a.isPublished).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Home className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Neue Anfragen</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/host/buchungen")}>
                Alle anzeigen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pendingBookings && pendingBookings.length > 0 ? (
                <div className="space-y-4">
                  {pendingBookings.slice(0, 5).map(booking => (
                    <div 
                      key={booking.id} 
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => navigate(`/host/buchungen/${booking.id}`)}
                    >
                      <div>
                        <p className="font-medium">{booking.guestName}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.accommodation?.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.checkIn), "dd. MMM", { locale: de })} - {format(new Date(booking.checkOut), "dd. MMM yyyy", { locale: de })}
                        </p>
                      </div>
                      <Badge className="status-pending">Neu</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Keine neuen Anfragen</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Check-ins */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Anstehende Check-ins</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/host/kalender")}>
                Kalender öffnen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {checkInsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : upcomingCheckIns && upcomingCheckIns.length > 0 ? (
                <div className="space-y-4">
                  {upcomingCheckIns.slice(0, 5).map(booking => (
                    <div 
                      key={booking.id} 
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{booking.guestName}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.accommodation?.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary">
                          {format(new Date(booking.checkIn), "dd. MMM", { locale: de })}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {booking.accommodation?.checkInTime || "15:00"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Keine anstehenden Check-ins</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Accommodations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Meine Inserate</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/host/inserate")}>
              Alle verwalten
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {accommodationsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : accommodations && accommodations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accommodations.slice(0, 6).map(accommodation => (
                  <div 
                    key={accommodation.id}
                    className="flex gap-4 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => navigate(`/host/inserate/${accommodation.id}/bearbeiten`)}
                  >
                    <img
                      src={accommodation.images?.[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=200&q=80"}
                      alt={accommodation.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{accommodation.title}</p>
                      <p className="text-sm text-muted-foreground">{accommodation.city}</p>
                      <Badge 
                        variant={accommodation.isPublished ? "default" : "secondary"}
                        className="mt-1"
                      >
                        {accommodation.isPublished ? "Online" : "Entwurf"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Home className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">Sie haben noch keine Inserate</p>
                <Button onClick={() => navigate("/host/inserate/neu")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Erstes Inserat erstellen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </HostLayout>
  );
}
