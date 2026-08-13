import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Shield, Briefcase, LineChart, FileSpreadsheet, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import PortfolioAdmin from "@/components/admin/PortfolioAdmin";
import HistoryAdmin from "@/components/admin/HistoryAdmin";
import UsersAdmin from "@/components/admin/UsersAdmin";
import TeamAdmin from "@/components/admin/TeamAdmin";
import StockProfilesAdmin from "@/components/admin/StockProfilesAdmin";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import ExcelExport from "@/components/admin/ExcelExport";

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const portfolioData = usePortfolioData();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    } catch (error) {
      console.error("Error:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Laster...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-serif font-bold mb-2">Ingen tilgang</h2>
            <p className="text-muted-foreground mb-4">
              Du har ikke administratortilgang til denne siden.
            </p>
            <Link to="/">
              <Button>Tilbake til forsiden</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbake til forsiden
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-serif font-bold">Administrasjon</h1>
        </div>

        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Portefølje
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Historikk
            </TabsTrigger>
            <TabsTrigger value="excel" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </TabsTrigger>
            <TabsTrigger value="aksjesider" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Aksjesider
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Komiteen
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Brukere
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio">
            <PortfolioAdmin
              holdings={portfolioData.holdings}
              quotes={portfolioData.quotes}
              onRefresh={portfolioData.refresh}
            />
          </TabsContent>

          <TabsContent value="history">
            <HistoryAdmin 
              history={portfolioData.history} 
              onRefresh={portfolioData.refresh} 
            />
          </TabsContent>

          <TabsContent value="excel">
            <ExcelExport />
          </TabsContent>

          <TabsContent value="aksjesider">
            <StockProfilesAdmin />
          </TabsContent>

          <TabsContent value="team">
            <TeamAdmin />
          </TabsContent>

          <TabsContent value="users">
            <UsersAdmin currentUser={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
