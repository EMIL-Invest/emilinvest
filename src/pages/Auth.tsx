import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Lock, User, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import emilLogo from "@/assets/emil-invest-logo.png";

type SignupType = "competition" | "admin";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [signupType, setSignupType] = useState<SignupType>("competition");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingInvitation, setCheckingInvitation] = useState(false);
  const [isInvited, setIsInvited] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkInvitation = async (emailToCheck: string) => {
    if (!emailToCheck || isLogin || signupType === "competition") return;
    
    setCheckingInvitation(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-invitation", {
        body: { email: emailToCheck },
      });

      if (error) {
        console.error("Error checking invitation:", error);
        setIsInvited(false);
      } else {
        setIsInvited(data?.invited || false);
      }
    } catch (error) {
      console.error("Error:", error);
      setIsInvited(false);
    } finally {
      setCheckingInvitation(false);
    }
  };

  const handleEmailBlur = () => {
    if (!isLogin && signupType === "admin" && email) {
      checkInvitation(email);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Innlogging feilet",
              description: "Feil e-post eller passord. Vennligst prøv igjen.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Feil",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Velkommen tilbake!",
            description: "Du er nå logget inn.",
          });
        }
      } else {
        // Check invitation before signup for admin accounts
        if (signupType === "admin" && !isInvited) {
          toast({
            title: "Ikke invitert",
            description: "Du må ha en invitasjon fra en administrator for å opprette admin-konto.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const redirectUrl = signupType === "competition" 
          ? `${window.location.origin}/konkurranse`
          : `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
              signup_type: signupType,
            },
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Bruker eksisterer allerede",
              description: "Denne e-postadressen er allerede registrert. Prøv å logge inn.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Feil",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Sjekk e-posten din!",
            description: "Vi har sendt deg en bekreftelseslenke. Klikk på lenken for å aktivere kontoen din.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Noe gikk galt",
        description: "Vennligst prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setIsInvited(null);
    setSignupType("competition");
  };

  const isSignupDisabled = () => {
    if (loading) return true;
    if (signupType === "admin" && !isInvited) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbake til forsiden
        </Link>

        <Card className="glass-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={emilLogo} alt="EMIL Invest" className="h-16 w-auto" />
            </div>
            <CardTitle className="font-serif text-2xl">
              {isLogin ? "Logg inn" : "Opprett konto"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Logg inn for å delta i konkurransen eller administrere" 
                : signupType === "competition"
                  ? "Registrer deg for å delta i aksjekonkurransen"
                  : "Registrer deg med en gyldig invitasjon"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label>Kontotype</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={signupType === "competition" ? "default" : "outline"}
                        className="w-full"
                        onClick={() => {
                          setSignupType("competition");
                          setIsInvited(null);
                        }}
                      >
                        🏆 Konkurranse
                      </Button>
                      <Button
                        type="button"
                        variant={signupType === "admin" ? "default" : "outline"}
                        className="w-full"
                        onClick={() => {
                          setSignupType("admin");
                          if (email) checkInvitation(email);
                        }}
                      >
                        🔐 Administrator
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {signupType === "competition" 
                        ? "Delta i aksjekonkurransen med virtuell portefølje"
                        : "Krever invitasjon fra administrator"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Fullt navn</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Ola Nordmann"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="din@epost.no"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (!isLogin) setIsInvited(null);
                    }}
                    onBlur={handleEmailBlur}
                    className="pl-10"
                    required
                  />
                </div>
                {!isLogin && signupType === "admin" && email && isInvited !== null && (
                  <div className={`flex items-center gap-2 text-sm ${isInvited ? "text-emerald-600" : "text-destructive"}`}>
                    {isInvited ? (
                      <>✓ E-posten har en gyldig invitasjon</>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        Ingen gyldig invitasjon funnet for denne e-posten
                      </>
                    )}
                  </div>
                )}
                {checkingInvitation && signupType === "admin" && (
                  <p className="text-sm text-muted-foreground">Sjekker invitasjon...</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Passord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSignupDisabled()}
              >
                {loading 
                  ? "Vennligst vent..." 
                  : isLogin 
                    ? "Logg inn" 
                    : signupType === "competition"
                      ? "Registrer for konkurranse"
                      : "Opprett admin-konto"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Har du en invitasjon? " : "Har du allerede konto? "}
              </span>
              <button
                type="button"
                onClick={handleModeSwitch}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Registrer deg" : "Logg inn"}
              </button>
            </div>

            {!isLogin && signupType === "admin" && (
              <p className="mt-4 text-xs text-center text-muted-foreground">
                For admin-tilgang må du bli invitert av en administrator.
                Kontakt Kristian Hove eller en annen admin.
              </p>
            )}
            {!isLogin && signupType === "competition" && (
              <p className="mt-4 text-xs text-center text-muted-foreground">
                Du vil motta en e-post med en bekreftelseslenke.
                Klikk på lenken for å aktivere kontoen din.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
