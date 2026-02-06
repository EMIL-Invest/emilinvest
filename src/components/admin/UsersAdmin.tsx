import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Users, Search } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  used: boolean;
  created_at: string;
  expires_at: string;
}

interface UsersAdminProps {
  currentUser: User | null;
}

const UsersAdmin = ({ currentUser }: UsersAdminProps) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("member");
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProfiles(), fetchUserRoles(), fetchInvitations()]);
    setLoading(false);
  };

  const fetchProfiles = async () => {
    // Admins need to see all profiles - we need a policy for this
    // For now, fetch from profiles where we have access
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, email, full_name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching profiles:", error);
    } else {
      setProfiles(data || []);
    }
  };

  const fetchUserRoles = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (error) {
      console.error("Error fetching user roles:", error);
    } else {
      setUserRoles(data || []);
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

  const getUserRole = (userId: string): string | null => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || null;
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !currentUser) return;

    setInviting(true);
    try {
      const { error } = await supabase.from("invitations").insert([{
        email: newEmail.toLowerCase(),
        role: newRole as "admin" | "member",
        invited_by: currentUser.id,
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
      toast({ title: "Invitasjon slettet" });
      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveRole = async (userId: string) => {
    try {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (error) throw error;
      toast({ title: "Rolle fjernet" });
      fetchUserRoles();
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (profile.email?.toLowerCase().includes(searchLower) || false) ||
      (profile.full_name?.toLowerCase().includes(searchLower) || false)
    );
  });

  const pendingInvitations = invitations.filter(i => !i.used);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Laster brukere...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Inviter ny bruker
          </CardTitle>
          <CardDescription>
            Send en invitasjon til en e-postadresse. Brukeren kan deretter registrere seg som medlem eller administrator.
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
      {pendingInvitations.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-serif">Ventende invitasjoner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
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
          </CardContent>
        </Card>
      )}

      {/* All Registered Users */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Users className="w-5 h-5" />
            Alle registrerte brukere ({profiles.length})
          </CardTitle>
          <CardDescription>
            Oversikt over alle brukere som har opprettet konto på nettsiden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Søk etter navn eller e-post..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              {searchTerm ? "Ingen brukere funnet." : "Ingen registrerte brukere ennå."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Registrert</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => {
                    const role = getUserRole(profile.user_id);
                    const isCurrentUser = profile.user_id === currentUser?.id;
                    
                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.full_name || "Ikke angitt"}
                        </TableCell>
                        <TableCell>{profile.email || "Ikke angitt"}</TableCell>
                        <TableCell>
                          {role ? (
                            <Badge variant={role === "admin" ? "default" : "secondary"}>
                              {role === "admin" ? "Administrator" : "Medlem"}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Konkurransedeltaker</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(profile.created_at).toLocaleDateString("no-NO", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {role && !isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveRole(profile.user_id)}
                              title="Fjern rolle"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersAdmin;
