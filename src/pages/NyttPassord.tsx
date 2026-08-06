import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

/**
 * Landingsside for «glemt passord»-lenken fra e-posten. Supabase logger
 * brukeren inn med en midlertidig gjenopprettingsøkt når lenken åpnes —
 * her setter de nytt passord med updateUser.
 */
const NyttPassord = () => {
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Gjenopprettingslenken setter økten via URL-fragmentet — lytt på begge.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({
        title: "Passordene er ikke like",
        description: "Skriv samme passord i begge feltene.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({
        title: "Passordet er oppdatert!",
        description: "Du er nå logget inn med det nye passordet.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Kunne ikke oppdatere passordet",
        description: error instanceof Error ? error.message : "Ukjent feil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
              <BrandLogo variant="wordmark" tone="navy" size="md" />
            </div>
            <CardTitle className="font-serif text-2xl">Sett nytt passord</CardTitle>
            <CardDescription>
              {hasSession === false
                ? "Lenken er utløpt eller ugyldig"
                : "Velg et nytt passord for kontoen din"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasSession === null ? (
              <p className="text-center text-muted-foreground py-4">Laster...</p>
            ) : hasSession === false ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tilbakestillingslenker er gyldige i én time og kan bare brukes
                  én gang. Be om en ny lenke fra innloggingssiden.
                </p>
                <Link to="/auth">
                  <Button className="w-full">Til innlogging</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nytt passord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
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
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Gjenta nytt passord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Lagrer..." : "Lagre nytt passord"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NyttPassord;
