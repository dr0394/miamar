import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Waves, Mail, Lock, User } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  
  const utils = trpc.useUtils();
  
  const login = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Erfolgreich angemeldet!");
      utils.auth.me.invalidate();
      setLocation("/host/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Anmeldung fehlgeschlagen");
    },
  });
  
  const register = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Registrierung erfolgreich!");
      utils.auth.me.invalidate();
      setLocation("/host/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Registrierung fehlgeschlagen");
    },
  });
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Bitte füllen Sie alle Felder aus");
      return;
    }
    login.mutate({ email: loginEmail, password: loginPassword });
  };
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) {
      toast.error("Bitte füllen Sie alle Felder aus");
      return;
    }
    if (registerPassword !== registerPasswordConfirm) {
      toast.error("Die Passwörter stimmen nicht überein");
      return;
    }
    if (registerPassword.length < 6) {
      toast.error("Das Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }
    register.mutate({ email: registerEmail, password: registerPassword, name: registerName });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-teal-700 rounded-full flex items-center justify-center">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-serif font-semibold text-teal-900">miamar</span>
          </a>
          <p className="mt-2 text-muted-foreground">Host-Bereich</p>
        </div>
        
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-serif">Willkommen</CardTitle>
            <CardDescription>
              Melden Sie sich an oder erstellen Sie ein Konto
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Anmelden</TabsTrigger>
                <TabsTrigger value="register">Registrieren</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-Mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="ihre@email.de"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Passwort</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-teal-700 hover:bg-teal-800"
                    disabled={login.isPending}
                  >
                    {login.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Anmelden...
                      </>
                    ) : (
                      "Anmelden"
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Ihr Name"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">E-Mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="ihre@email.de"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Passwort</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Mindestens 6 Zeichen"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password-confirm">Passwort bestätigen</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password-confirm"
                        type="password"
                        placeholder="Passwort wiederholen"
                        value={registerPasswordConfirm}
                        onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-teal-700 hover:bg-teal-800"
                    disabled={register.isPending}
                  >
                    {register.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrieren...
                      </>
                    ) : (
                      "Konto erstellen"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 text-center">
              <a href="/" className="text-sm text-muted-foreground hover:text-teal-700">
                ← Zurück zur Startseite
              </a>
            </div>
          </CardContent>
        </Card>
        
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Mit der Anmeldung akzeptieren Sie unsere Nutzungsbedingungen und Datenschutzrichtlinie.
        </p>
      </div>
    </div>
  );
}
