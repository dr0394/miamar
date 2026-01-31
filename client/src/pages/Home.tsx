import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Users, 
  Star, 
  Waves, 
  Mountain, 
  Sparkles,
  Heart,
  Shield,
  Phone,
  Mail,
  ArrowRight,
  Calendar,
  Home as HomeIcon,
  Coffee,
  Wifi,
  Car
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import AccommodationCard from "@/components/AccommodationCard";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const { data: accommodations, isLoading } = trpc.accommodations.featured.useQuery();
  
  // Auto-slide effect
  useEffect(() => {
    if (!accommodations || accommodations.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % accommodations.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [accommodations]);

  const nextSlide = () => {
    if (accommodations) {
      setCurrentSlide((prev) => (prev + 1) % accommodations.length);
    }
  };

  const prevSlide = () => {
    if (accommodations) {
      setCurrentSlide((prev) => (prev - 1 + accommodations.length) % accommodations.length);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full teal-gradient flex items-center justify-center">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-display font-semibold tracking-tight text-foreground">
              miamar
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#unterkuenfte" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Unterkünfte
            </a>
            <a href="#ueber-uns" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Über uns
            </a>
            <a href="#kontakt" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Kontakt
            </a>
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/host/dashboard">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/suche">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Jetzt buchen
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2070&auto=format&fit=crop')`
          }}
        />
        <div className="absolute inset-0 hero-gradient" />
        
        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-32 h-32 border border-white/20 rounded-full animate-pulse" />
        <div className="absolute bottom-1/3 right-16 w-24 h-24 border border-white/10 rounded-full" />
        
        {/* Content */}
        <div className="relative z-10 container text-center text-white px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm md:text-base uppercase tracking-[0.3em] text-white/80 mb-6 font-medium">
              Willkommen bei
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-medium mb-6 leading-tight">
              miamar
            </h1>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent mx-auto mb-8" />
            <p className="text-xl md:text-2xl font-light text-white/90 mb-4 max-w-2xl mx-auto leading-relaxed">
              Exklusive Ferienwohnungen für unvergessliche Momente
            </p>
            <p className="text-base md:text-lg text-white/70 mb-12 max-w-xl mx-auto">
              Entdecken Sie handverlesene Unterkünfte an den schönsten Orten – 
              persönlich, authentisch und mit Liebe zum Detail.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/suche">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg font-medium btn-elegant"
                >
                  Unterkünfte entdecken
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#ueber-uns">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/50 text-white hover:bg-white/10 px-8 py-6 text-lg font-medium bg-transparent"
                >
                  Mehr erfahren
                </Button>
              </a>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/70 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.2em] text-primary mb-4 font-medium">
              Warum miamar?
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-medium text-foreground mb-4">
              Ihr Urlaub in besten Händen
            </h2>
            <div className="line-elegant mt-6" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 group">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Heart className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-display font-medium mb-3 text-foreground">
                Persönliche Betreuung
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Wir sind vor Ort für Sie da – von der Buchung bis zur Abreise. 
                Ihre Zufriedenheit ist unser Antrieb.
              </p>
            </div>
            
            <div className="text-center p-8 group">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-display font-medium mb-3 text-foreground">
                Handverlesene Qualität
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Jede Unterkunft wird von uns persönlich ausgewählt und 
                entspricht höchsten Ansprüchen an Komfort und Stil.
              </p>
            </div>
            
            <div className="text-center p-8 group">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-display font-medium mb-3 text-foreground">
                Transparente Preise
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Keine versteckten Kosten, keine bösen Überraschungen. 
                Bei uns wissen Sie immer, was Sie erwartet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Accommodations Slider Section */}
      <section id="unterkuenfte" className="py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.2em] text-primary mb-4 font-medium">
              Unsere Unterkünfte
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-medium text-foreground mb-4">
              Finden Sie Ihr Traumdomizil
            </h2>
            <div className="line-elegant mt-6" />
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : accommodations && accommodations.length > 0 ? (
            <div className="relative max-w-6xl mx-auto">
              {/* Slider */}
              <div className="overflow-hidden rounded-2xl shadow-2xl">
                <div 
                  ref={sliderRef}
                  className="flex transition-transform duration-700 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {accommodations.map((acc) => (
                    <div key={acc.id} className="w-full flex-shrink-0">
                      <div className="relative aspect-[16/9] md:aspect-[21/9]">
                        <img
                          src={(acc as any).images?.[0]?.url || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1920'}
                          alt={acc.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        {/* Content Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
                          <div className="max-w-2xl">
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="w-4 h-4 text-white/80" />
                              <span className="text-sm text-white/80">{acc.city}, {acc.region}</span>
                            </div>
                            <h3 className="text-2xl md:text-4xl font-display font-medium mb-3">
                              {acc.title}
                            </h3>
                            <p className="text-white/80 mb-6 line-clamp-2 max-w-xl">
                              {acc.shortDescription || acc.description}
                            </p>
                            <div className="flex items-center gap-6 mb-6">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">bis {acc.maxGuests} Gäste</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <HomeIcon className="w-4 h-4" />
                                <span className="text-sm">{acc.bedrooms} Schlafzimmer</span>
                              </div>
                              {acc.averageRating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm">{Number(acc.averageRating).toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <Link href={`/unterkunft/${acc.slug}`}>
                                <Button className="bg-white text-primary hover:bg-white/90">
                                  Details ansehen
                                  <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                              </Link>
                              <span className="text-2xl font-display">
                                ab €{acc.pricePerNight} <span className="text-base font-normal text-white/70">/ Nacht</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Navigation Arrows */}
              {accommodations.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
                  >
                    <ChevronLeft className="w-6 h-6 text-foreground" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
                  >
                    <ChevronRight className="w-6 h-6 text-foreground" />
                  </button>
                </>
              )}
              
              {/* Dots */}
              {accommodations.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {accommodations.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        idx === currentSlide 
                          ? 'bg-primary w-8' 
                          : 'bg-primary/30 hover:bg-primary/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <HomeIcon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-display font-medium mb-3 text-foreground">
                Neue Unterkünfte in Kürze
              </h3>
              <p className="text-muted-foreground mb-6">
                Wir arbeiten daran, Ihnen bald exklusive Ferienwohnungen zu präsentieren.
              </p>
              <Link href="/suche">
                <Button className="bg-primary hover:bg-primary/90">
                  Alle Unterkünfte ansehen
                </Button>
              </Link>
            </div>
          )}
          
          {/* View All Button */}
          {accommodations && accommodations.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/suche">
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white">
                  Alle Unterkünfte entdecken
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="ueber-uns" className="py-24 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200"
                  alt="Luxuriöse Ferienwohnung"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative Element */}
              <div className="absolute -bottom-8 -right-8 w-48 h-48 border-4 border-primary/20 rounded-2xl -z-10" />
              <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary/10 rounded-full -z-10" />
            </div>
            
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-primary mb-4 font-medium">
                Über miamar
              </p>
              <h2 className="text-3xl md:text-4xl font-display font-medium text-foreground mb-6 leading-tight">
                Mehr als nur eine Unterkunft – 
                <span className="text-primary"> ein Erlebnis</span>
              </h2>
              <div className="line-elegant !mx-0 mb-8" />
              
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  Bei <strong className="text-foreground">miamar</strong> glauben wir, dass der perfekte Urlaub 
                  mit der perfekten Unterkunft beginnt. Deshalb wählen wir jede 
                  Ferienwohnung persönlich aus und achten auf höchste Qualitätsstandards.
                </p>
                <p>
                  Unsere Leidenschaft ist es, Ihnen nicht nur ein Dach über dem Kopf 
                  zu bieten, sondern ein Zuhause auf Zeit – mit allem Komfort, den 
                  Sie sich wünschen, und der persönlichen Note, die den Unterschied macht.
                </p>
                <p>
                  Von der ersten Anfrage bis zu Ihrer Abreise sind wir für Sie da. 
                  Denn bei uns sind Sie nicht nur Gast – Sie sind Teil der miamar-Familie.
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-6 mt-10">
                <div className="text-center">
                  <div className="text-3xl font-display font-semibold text-primary mb-1">100%</div>
                  <div className="text-sm text-muted-foreground">Zufriedenheit</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-display font-semibold text-primary mb-1">24/7</div>
                  <div className="text-sm text-muted-foreground">Erreichbar</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-display font-semibold text-primary mb-1">♥</div>
                  <div className="text-sm text-muted-foreground">Mit Liebe</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Highlight */}
      <section className="py-20 teal-gradient text-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-medium mb-4">
              Ausstattung, die begeistert
            </h2>
            <p className="text-white/80 max-w-xl mx-auto">
              Alle unsere Unterkünfte bieten erstklassige Ausstattung für Ihren perfekten Aufenthalt
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="flex flex-col items-center gap-3">
              <Wifi className="w-8 h-8" />
              <span className="text-sm">Schnelles WLAN</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Car className="w-8 h-8" />
              <span className="text-sm">Parkplatz</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Coffee className="w-8 h-8" />
              <span className="text-sm">Voll ausgestattet</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Mountain className="w-8 h-8" />
              <span className="text-sm">Beste Lage</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Calendar className="w-8 h-8" />
              <span className="text-sm">Flexible Buchung</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-medium text-foreground mb-6">
              Bereit für Ihren Traumurlaub?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Entdecken Sie unsere exklusiven Ferienwohnungen und buchen Sie 
              noch heute Ihren unvergesslichen Aufenthalt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/suche">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 py-6 text-lg">
                  Jetzt Unterkunft finden
                </Button>
              </Link>
              <a href="#kontakt">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white px-10 py-6 text-lg">
                  Kontakt aufnehmen
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="kontakt" className="py-24 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.2em] text-primary mb-4 font-medium">
              Kontakt
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-medium text-foreground mb-4">
              Wir freuen uns auf Sie
            </h2>
            <div className="line-elegant mt-6" />
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-display font-medium mb-4 text-foreground">
                    Haben Sie Fragen?
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Unser Team steht Ihnen gerne zur Verfügung. Kontaktieren Sie uns 
                    für Buchungsanfragen, Fragen zu unseren Unterkünften oder einfach 
                    für einen freundlichen Austausch.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <a 
                    href="mailto:info@miamar.de" 
                    className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">E-Mail</div>
                      <div className="font-medium text-foreground">info@miamar.de</div>
                    </div>
                  </a>
                  
                  <a 
                    href="tel:+4912345678" 
                    className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Telefon</div>
                      <div className="font-medium text-foreground">+49 123 456 78</div>
                    </div>
                  </a>
                </div>
              </div>
              
              <div className="bg-secondary/30 rounded-2xl p-8">
                <h3 className="text-xl font-display font-medium mb-6 text-foreground">
                  Schnellanfrage
                </h3>
                <form className="space-y-4">
                  <input
                    type="text"
                    placeholder="Ihr Name"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="email"
                    placeholder="Ihre E-Mail"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <textarea
                    placeholder="Ihre Nachricht"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white py-6">
                    Nachricht senden
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-16">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Waves className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-display font-semibold">miamar</span>
              </div>
              <p className="text-white/70 leading-relaxed max-w-md">
                Exklusive Ferienwohnungen für unvergessliche Momente. 
                Handverlesen, persönlich betreut und mit Liebe zum Detail.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Navigation</h4>
              <ul className="space-y-2 text-white/70">
                <li><Link href="/suche" className="hover:text-white transition-colors">Unterkünfte</Link></li>
                <li><a href="#ueber-uns" className="hover:text-white transition-colors">Über uns</a></li>
                <li><a href="#kontakt" className="hover:text-white transition-colors">Kontakt</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Rechtliches</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Impressum</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Datenschutz</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AGB</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} miamar. Alle Rechte vorbehalten.
            </p>
            <p className="text-white/50 text-sm">
              Mit ♥ erstellt
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
