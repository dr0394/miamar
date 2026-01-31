import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Home
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import HostLayout from "@/components/HostLayout";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function HostCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const { data: accommodations, isLoading: accommodationsLoading } = trpc.accommodations.myAccommodations.useQuery();
  
  const accommodationId = selectedAccommodation ? parseInt(selectedAccommodation) : (accommodations?.[0]?.id || 0);

  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);

  const { data: availability, isLoading: availabilityLoading } = trpc.availability.get.useQuery(
    {
      accommodationId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    { enabled: !!accommodationId }
  );

  const { data: bookings } = trpc.bookings.myBookings.useQuery(
    { status: "confirmed" },
    { enabled: !!accommodationId }
  );

  const utils = trpc.useUtils();

  const blockDates = trpc.availability.block.useMutation({
    onSuccess: () => {
      utils.availability.get.invalidate();
      setSelectedDates([]);
      toast.success("Daten blockiert");
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Blockieren");
    },
  });

  const unblockDates = trpc.availability.unblock.useMutation({
    onSuccess: () => {
      utils.availability.get.invalidate();
      setSelectedDates([]);
      toast.success("Daten freigegeben");
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Freigeben");
    },
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Add padding days for the first week
    const firstDayOfWeek = startDate.getDay();
    const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const paddedDays: (Date | null)[] = Array(paddingDays).fill(null);
    return [...paddedDays, ...days];
  }, [currentMonth]);

  // Get day status
  const getDayStatus = (date: Date): "available" | "blocked" | "booked" => {
    if (!availability) return "available";
    
    const blocked = availability.find(a => isSameDay(new Date(a.date), date));
    if (blocked) {
      return blocked.status === "booked" ? "booked" : "blocked";
    }
    
    // Check if there's a confirmed booking for this date
    const hasBooking = bookings?.some(b => {
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      return date >= checkIn && date < checkOut && b.accommodationId === accommodationId;
    });
    
    return hasBooking ? "booked" : "available";
  };

  const toggleDateSelection = (date: Date) => {
    const status = getDayStatus(date);
    if (status === "booked") return; // Can't select booked dates
    
    setSelectedDates(prev => {
      const isSelected = prev.some(d => isSameDay(d, date));
      if (isSelected) {
        return prev.filter(d => !isSameDay(d, date));
      }
      return [...prev, date];
    });
  };

  const handleBlock = () => {
    if (!accommodationId || selectedDates.length === 0) return;
    blockDates.mutate({
      accommodationId,
      dates: selectedDates.map(d => d.toISOString()),
      note: "Manuell blockiert",
    });
  };

  const handleUnblock = () => {
    if (!accommodationId || selectedDates.length === 0) return;
    unblockDates.mutate({
      accommodationId,
      dates: selectedDates.map(d => d.toISOString()),
    });
  };

  const selectedAccommodationData = accommodations?.find(a => a.id === accommodationId);

  if (accommodationsLoading) {
    return (
      <HostLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </HostLayout>
    );
  }

  if (!accommodations || accommodations.length === 0) {
    return (
      <HostLayout>
        <Card className="p-12 text-center">
          <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Keine Inserate vorhanden</h3>
          <p className="text-muted-foreground">
            Erstellen Sie zuerst ein Inserat, um den Kalender zu nutzen.
          </p>
        </Card>
      </HostLayout>
    );
  }

  return (
    <HostLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Kalender</h1>
            <p className="text-muted-foreground">
              Verwalten Sie die Verfügbarkeit Ihrer Unterkünfte
            </p>
          </div>
          
          <Select
            value={selectedAccommodation || accommodations[0]?.id.toString()}
            onValueChange={setSelectedAccommodation}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Unterkunft auswählen" />
            </SelectTrigger>
            <SelectContent>
              {accommodations.map(acc => (
                <SelectItem key={acc.id} value={acc.id.toString()}>
                  {acc.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {format(currentMonth, "MMMM yyyy", { locale: de })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {availabilityLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {WEEKDAYS.map(day => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      if (!day) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                      }

                      const status = getDayStatus(day);
                      const isSelected = selectedDates.some(d => isSameDay(d, day));
                      const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => !isPast && toggleDateSelection(day)}
                          disabled={isPast || status === "booked"}
                          className={cn(
                            "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative",
                            isPast && "opacity-40 cursor-not-allowed",
                            status === "available" && !isPast && "hover:bg-green-100 dark:hover:bg-green-900/30",
                            status === "blocked" && "bg-gray-200 dark:bg-gray-700",
                            status === "booked" && "bg-primary/20 cursor-not-allowed",
                            isSelected && "ring-2 ring-primary ring-offset-2",
                            isToday(day) && "font-bold"
                          )}
                        >
                          <span>{format(day, "d")}</span>
                          {status === "booked" && (
                            <span className="absolute bottom-1 w-2 h-2 rounded-full bg-primary" />
                          )}
                          {status === "blocked" && (
                            <span className="absolute bottom-1 w-2 h-2 rounded-full bg-gray-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Legende</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-white border" />
                  <span className="text-sm">Verfügbar</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                  <span className="text-sm">Blockiert</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-primary/20" />
                  <span className="text-sm">Gebucht</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {selectedDates.length === 0 
                    ? "Wählen Sie Daten im Kalender aus"
                    : `${selectedDates.length} Datum/Daten ausgewählt`
                  }
                </p>
                <Button
                  className="w-full"
                  onClick={handleBlock}
                  disabled={selectedDates.length === 0 || blockDates.isPending}
                >
                  {blockDates.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Blockieren
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleUnblock}
                  disabled={selectedDates.length === 0 || unblockDates.isPending}
                >
                  {unblockDates.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Freigeben
                </Button>
              </CardContent>
            </Card>

            {/* Selected Accommodation Info */}
            {selectedAccommodationData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Unterkunft</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <img
                      src={selectedAccommodationData.images?.[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=200&q=80"}
                      alt={selectedAccommodationData.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium line-clamp-1">{selectedAccommodationData.title}</p>
                      <p className="text-sm text-muted-foreground">{selectedAccommodationData.city}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </HostLayout>
  );
}
