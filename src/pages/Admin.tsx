import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus, Trash2, Users, Shield, Briefcase, LineChart } from "lucide-react";
import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import PortfolioAdmin from "@/components/admin/PortfolioAdmin";
import HistoryAdmin from "@/components/admin/HistoryAdmin";
import { usePortfolioData } from "@/hooks/usePortfolioData";

interface Invitation {
  id: string;
  email: string;
  role: string;
  used: boolean;
  created_at: string;
  expires_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    email: string | null;
    full_name: string | null;
  } | null;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("member");
  const [inviting, setInviting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
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
        if (data) {
          fetchInvitations();
          fetchUserRoles();
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitations:", error);
    } else {
      setInvitations(data || []);
    }
  };

  const fetchUserRoles = async () => {
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .order("created_at", { ascending: false });

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError);
      return;
    }

    const userIds = rolesData?.map(r => r.user_id) || [];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, email, full_name")
      .in("user_id", userIds);

    const combined = (rolesData || []).map(role => ({
      ...role,
      profiles: profilesData?.find(p => p.user_id === role.user_id) || null
    }));

    setUserRoles(combined);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !user) return;

    setInviting(true);
    try {
      const { error } = await supabase.from("invitations").insert([{
        email: newEmail.toLowerCase(),
        role: newRole as "admin" | "member",
        invited_by: user.id,
      }]);

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "E-post allerede invitert",
            description: "Denne e-postadressen har allerede en invitasjon.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Invitasjon sendt!",
          description: `${newEmail} kan nå registrere seg.`,
        });
        setNewEmail("");
        setNewRole("member");
        fetchInvitations();
      }
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    try {
      const { error } = await supabase.from("invitations").delete().eq("id", id);
      if (error) throw error;
      toast({
        title: "Invitasjon slettet",
      });
      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveRole = async (id: string) => {
    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
      toast({
        title: "Rolle fjernet",
      });
      fetchUserRoles();
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Portefølje
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Historikk
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Brukere
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio">
            <PortfolioAdmin 
              holdings={portfolioData.holdings} 
              onRefresh={portfolioData.refresh} 
            />
          </TabsContent>

          <TabsContent value="history">
            <HistoryAdmin 
              history={portfolioData.history} 
              onRefresh={portfolioData.refresh} 
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* Invite Form */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Inviter ny bruker
                </CardTitle>
                <CardDescription>
                  Send en invitasjon til en e-postadresse. Brukeren kan deretter registrere seg.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="email" className="sr-only">E-post</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e-post@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-full sm:w-40">
                    <Label htmlFor="role" className="sr-only">Rolle</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Medlem</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={inviting}>
                    {inviting ? "Sender..." : "Send invitasjon"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Pending Invitations */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-serif">Ventende invitasjoner</CardTitle>
              </CardHeader>
              <CardContent>
                {invitations.filter(i => !i.used).length === 0 ? (
                  <p className="text-muted-foreground text-sm">Ingen ventende invitasjoner.</p>
                ) : (
                  <div className="space-y-3">
                    {invitations.filter(i => !i.used).map((invitation) => (
                      <div 
                        key={invitation.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={invitation.role === "admin" ? "default" : "secondary"}>
                              {invitation.role === "admin" ? "Administrator" : "Medlem"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Utløper: {new Date(invitation.expires_at).toLocaleDateString("no-NO")}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvitation(invitation.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Users */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Aktive brukere
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userRoles.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Ingen brukere med roller ennå.</p>
                ) : (
                  <div className="space-y-3">
                    {userRoles.map((userRole) => (
                      <div 
                        key={userRole.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">
                            {userRole.profiles?.full_name || userRole.profiles?.email || "Ukjent bruker"}
                          </p>
                          {userRole.profiles?.email && userRole.profiles?.full_name && (
                            <p className="text-sm text-muted-foreground">{userRole.profiles.email}</p>
                          )}
                          <Badge 
                            variant={userRole.role === "admin" ? "default" : "secondary"}
                            className="mt-1"
                          >
                            {userRole.role === "admin" ? "Administrator" : "Medlem"}
                          </Badge>
                        </div>
                        {userRole.user_id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRole(userRole.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
