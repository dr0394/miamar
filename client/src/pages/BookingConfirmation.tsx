import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Calendar, MapPin, Users, ArrowRight, Home } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";

export default function BookingConfirmation() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  return (
    <PublicLayout>
      <div className="container max-w-2xl py-20">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold mb-2">Vielen Dank!</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Ihre Buchungsanfrage wurde erfolgreich übermittelt.
            </p>

            <div className="bg-secondary/30 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold mb-4">Was passiert als Nächstes?</h2>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm shrink-0">1</span>
                  <div>
                    <p className="font-medium">Bestätigung per E-Mail</p>
                    <p className="text-sm text-muted-foreground">
                      Sie erhalten in Kürze eine E-Mail mit den Details Ihrer Anfrage.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm shrink-0">2</span>
                  <div>
                    <p className="font-medium">Prüfung durch den Gastgeber</p>
                    <p className="text-sm text-muted-foreground">
                      Der Gastgeber wird Ihre Anfrage prüfen und sich bei Ihnen melden.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm shrink-0">3</span>
                  <div>
                    <p className="font-medium">Buchungsbestätigung</p>
                    <p className="text-sm text-muted-foreground">
                      Nach Bestätigung erhalten Sie alle weiteren Informationen für Ihren Aufenthalt.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate("/")}>
                <Home className="mr-2 h-4 w-4" />
                Zur Startseite
              </Button>
              <Button onClick={() => navigate("/suche")}>
                Weitere Unterkünfte entdecken
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
