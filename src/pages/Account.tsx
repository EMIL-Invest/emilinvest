import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Account = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleDeleteAccount = async () => {
    if (confirmText !== "SLETT") return;

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("delete-account", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      // Sign out locally after deletion
      await supabase.auth.signOut();
      
      toast({
        title: "Konto slettet",
        description: "Kontoen din og all tilknyttet data er nå slettet.",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Kunne ikke slette konto",
        description: "Noe gikk galt. Vennligst prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="py-24">
          <div className="section-container text-center">
            <p className="text-muted-foreground">Laster...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-24">
        <div className="section-container max-w-2xl mx-auto">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Min konto</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Kontoinformasjon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                E-post: <span className="text-foreground">{user?.email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Opprettet: <span className="text-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('nb-NO') : '-'}
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Faresone
              </CardTitle>
              <CardDescription>
                Handlinger her kan ikke angres.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Slett min konto
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Er du helt sikker?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>
                        Dette vil permanent slette kontoen din og all tilknyttet data, inkludert:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Din konkurranseportefølje og transaksjonshistorikk</li>
                        <li>Din plassering på ledertavlen</li>
                        <li>Din profil og brukerdata</li>
                      </ul>
                      <p className="font-medium">
                        Denne handlingen kan ikke angres.
                      </p>
                      <div className="pt-2">
                        <Label htmlFor="confirmDelete">
                          Skriv <span className="font-bold">SLETT</span> for å bekrefte:
                        </Label>
                        <Input
                          id="confirmDelete"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="SLETT"
                          className="mt-1"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmText("")}>Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={confirmText !== "SLETT" || deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? "Sletter..." : "Slett kontoen min"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
