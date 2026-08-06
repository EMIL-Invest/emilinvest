import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Instagram, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";

interface InstagramPost {
  id: string;
  instagram_url: string;
  image_url: string;
  caption: string | null;
  posted_at: string;
  created_at: string;
}

interface InstagramAdminProps {
  userId: string;
}

const InstagramAdmin = ({ userId }: InstagramAdminProps) => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("instagram_posts")
        .select("*")
        .order("posted_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instagramUrl || !imageUrl) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("instagram_posts").insert([
        {
          instagram_url: instagramUrl,
          image_url: imageUrl,
          caption: caption || null,
          created_by: userId,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Innlegg lagt til!",
        description: "Instagram-innlegget er nå synlig på nettsiden.",
      });

      setInstagramUrl("");
      setImageUrl("");
      setCaption("");
      fetchPosts();
    } catch (error) {
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Ukjent feil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Er du sikker på at du vil slette dette innlegget?")) return;
    try {
      const { error } = await supabase.from("instagram_posts").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Innlegg slettet",
      });
      fetchPosts();
    } catch (error) {
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Ukjent feil",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Legg til Instagram-innlegg
          </CardTitle>
          <CardDescription>
            Lim inn lenken til Instagram-innlegget og en URL til bildet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="instagram-url">Instagram URL</Label>
                <Input
                  id="instagram-url"
                  type="url"
                  placeholder="https://instagram.com/p/..."
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="image-url">Bilde URL</Label>
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="caption">Bildetekst (valgfritt)</Label>
              <Textarea
                id="caption"
                placeholder="Skriv en kort beskrivelse..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Lagrer...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Legg til innlegg
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Instagram className="w-5 h-5" />
            Instagram-innlegg ({posts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Laster innlegg...</p>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Ingen innlegg lagt til ennå.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="relative group rounded-lg overflow-hidden bg-muted"
                >
                  <div className="aspect-square">
                    <img
                      src={post.image_url}
                      alt={post.caption || "Instagram post"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                      href={post.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                      <ExternalLink className="w-5 h-5 text-white" />
                    </a>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 bg-destructive/80 hover:bg-destructive rounded-full transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  {post.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-xs line-clamp-2">{post.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstagramAdmin;
