import { useEffect, useState } from "react";
import { Plus, Trash2, Users, Upload, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  sort_order: number;
  is_active: boolean;
}

const getInitials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).map(p => p[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join("").toUpperCase();

const TeamAdmin = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) setMembers(data);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const showError = (error: unknown) =>
    toast({
      title: "Feil",
      description: error instanceof Error ? error.message : "Ukjent feil",
      variant: "destructive",
    });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const maxOrder = members.reduce((m, x) => Math.max(m, x.sort_order), 0);
      const { error } = await supabase.from("team_members").insert({
        name: newName.trim(),
        role: newRole.trim(),
        sort_order: maxOrder + 10,
      });
      if (error) throw error;
      toast({ title: "Medlem lagt til" });
      setNewName(""); setNewRole(""); setShowAddForm(false);
      fetchMembers();
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (member: TeamMember, file: File) => {
    setUploadingFor(member.id);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${member.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("team")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("team").getPublicUrl(path);
      // Cache-bust slik at nytt bilde vises umiddelbart
      const url = `${urlData.publicUrl}?v=${Date.now()}`;

      const { error } = await supabase
        .from("team_members")
        .update({ photo_url: url })
        .eq("id", member.id);
      if (error) throw error;

      toast({ title: "Bilde lastet opp", description: member.name });
      fetchMembers();
    } catch (error) {
      showError(error);
    } finally {
      setUploadingFor(null);
    }
  };

  const handleUpdate = async (id: string, patch: Partial<TeamMember>) => {
    try {
      const { error } = await supabase.from("team_members").update(patch).eq("id", id);
      if (error) throw error;
      fetchMembers();
    } catch (error) {
      showError(error);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const other = index + direction;
    if (other < 0 || other >= members.length) return;
    const a = members[index], b = members[other];
    await handleUpdate(a.id, { sort_order: b.sort_order });
    await handleUpdate(b.id, { sort_order: a.sort_order });
  };

  const handleDelete = async (member: TeamMember) => {
    if (!window.confirm(`Er du sikker på at du vil slette ${member.name}?`)) return;
    try {
      const { error } = await supabase.from("team_members").delete().eq("id", member.id);
      if (error) throw error;
      toast({ title: "Medlem slettet" });
      fetchMembers();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif flex items-center gap-2">
              <Users className="w-5 h-5" />
              Komitémedlemmer
            </CardTitle>
            <CardDescription>
              Navn, rolle, rekkefølge og bilde for «Møt komiteen»-seksjonen.
              Bilder bør være kvadratiske (f.eks. 600×600) for best resultat.
            </CardDescription>
          </div>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Legg til
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <form onSubmit={handleAdd} className="p-4 rounded-lg bg-muted/50 border border-border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-name">Navn</Label>
                <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} required minLength={2} />
              </div>
              <div>
                <Label htmlFor="new-role">Rolle</Label>
                <Input id="new-role" value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="F.eks. Analytiker" required />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" disabled={saving}>{saving ? "Lagrer..." : "Legg til"}</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Avbryt</Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {members.map((member, index) => (
            <div
              key={member.id}
              className={`flex items-center gap-3 p-3 rounded-lg border border-border/60 ${member.is_active ? "" : "opacity-50"}`}
            >
              <Avatar className="w-11 h-11 shrink-0">
                {member.photo_url && <AvatarImage src={member.photo_url} alt={member.name} className="object-cover" />}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.name}</p>
                <p className="text-xs text-muted-foreground truncate">{member.role}</p>
              </div>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(member, file);
                    e.target.value = "";
                  }}
                />
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingFor === member.id ? "Laster opp..." : member.photo_url ? "Bytt bilde" : "Last opp bilde"}
                </span>
              </label>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleMove(index, -1)} disabled={index === 0}>
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleMove(index, 1)} disabled={index === members.length - 1}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-1.5" title="Vis på nettsiden">
                <Switch
                  checked={member.is_active}
                  onCheckedChange={(checked) => handleUpdate(member.id, { is_active: checked })}
                />
              </div>

              <Button variant="ghost" size="sm" onClick={() => handleDelete(member)}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Ingen medlemmer ennå - kjør 03_team_medlemmer.sql eller legg til manuelt.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamAdmin;
