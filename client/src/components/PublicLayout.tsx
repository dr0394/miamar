import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { 
  Home, 
  Menu, 
  X, 
  User,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: config } = trpc.config.get.useQuery();

  const platformName = config?.platform_name || "FeWo Booking";
  const logoUrl = config?.logo_url;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b">
        <div className="container max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={platformName} className="h-8" />
              ) : (
                <>
                  <Home className="h-6 w-6 text-primary" />
                  <span className="font-bold text-xl">{platformName}</span>
                </>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/suche" className="text-muted-foreground hover:text-foreground transition-colors">
                Unterkünfte
              </Link>
              
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <User className="h-4 w-4" />
                      {user?.name || "Mein Konto"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {(user?.role === "host" || user?.role === "admin") && (
                      <>
                        <DropdownMenuItem onClick={() => navigate("/host/dashboard")}>
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Host Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Abmelden
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => window.location.href = getLoginUrl()}>
                  Anmelden
                </Button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="container py-4 space-y-4">
              <Link 
                href="/suche" 
                className="block py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Unterkünfte
              </Link>
              
              {isAuthenticated ? (
                <>
                  {(user?.role === "host" || user?.role === "admin") && (
                    <Link 
                      href="/host/dashboard" 
                      className="block py-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Host Dashboard
                    </Link>
                  )}
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    Abmelden
                  </Button>
                </>
              ) : (
                <Button className="w-full" onClick={() => window.location.href = getLoginUrl()}>
                  Anmelden
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-secondary/50 border-t">
        <div className="container max-w-7xl py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt={platformName} className="h-6" />
                ) : (
                  <>
                    <Home className="h-5 w-5 text-primary" />
                    <span className="font-bold">{platformName}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Finden Sie Ihre perfekte Ferienunterkunft – direkt beim Gastgeber.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Entdecken</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/suche" className="hover:text-foreground">Alle Unterkünfte</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Für Gastgeber</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/host/dashboard" className="hover:text-foreground">Dashboard</Link></li>
                <li><Link href="/host/inserate/neu" className="hover:text-foreground">Unterkunft inserieren</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{config?.support_email || "support@example.com"}</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {platformName}. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
