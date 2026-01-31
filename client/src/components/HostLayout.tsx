import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Home, 
  LayoutDashboard,
  Building2,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface HostLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/host/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/host/inserate", label: "Inserate", icon: Building2 },
  { href: "/host/kalender", label: "Kalender", icon: Calendar },
  { href: "/host/buchungen", label: "Buchungen", icon: MessageSquare },
];

export default function HostLayout({ children }: HostLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: config } = trpc.config.get.useQuery();

  const platformName = config?.platform_name || "FeWo Booking";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <span className="font-semibold">{platformName}</span>
          <Link href="/">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r fixed left-0 top-0">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">{platformName}</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    location === item.href || location.startsWith(item.href + "/")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user?.name?.charAt(0) || "H"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name || "Gastgeber"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </aside>

        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white">
              <div className="h-14 flex items-center justify-between px-4 border-b">
                <span className="font-bold">{platformName}</span>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="p-4 space-y-1">
                {navItems.map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                        location === item.href || location.startsWith(item.href + "/")
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </Button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
