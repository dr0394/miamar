import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Public Pages
import Home from "./pages/Home";
import Search from "./pages/Search";
import AccommodationDetail from "./pages/AccommodationDetail";
import BookingConfirmation from "./pages/BookingConfirmation";

// Auth Pages
import Login from "./pages/Login";

// Host Pages
import HostDashboard from "./pages/host/Dashboard";
import HostAccommodations from "./pages/host/Accommodations";
import CreateAccommodation from "./pages/host/CreateAccommodation";
import EditAccommodation from "./pages/host/EditAccommodation";
import HostCalendar from "./pages/host/Calendar";
import HostBookings from "./pages/host/Bookings";
import BookingDetail from "./pages/host/BookingDetail";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/suche" component={Search} />
      <Route path="/unterkunft/:slug" component={AccommodationDetail} />
      <Route path="/buchung/:id/bestaetigung" component={BookingConfirmation} />
      
      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      
      {/* Host Routes */}
      <Route path="/host/dashboard" component={HostDashboard} />
      <Route path="/host/inserate" component={HostAccommodations} />
      <Route path="/host/inserate/neu" component={CreateAccommodation} />
      <Route path="/host/inserate/:id/bearbeiten" component={EditAccommodation} />
      <Route path="/host/kalender" component={HostCalendar} />
      <Route path="/host/buchungen" component={HostBookings} />
      <Route path="/host/buchungen/:id" component={BookingDetail} />
      
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
