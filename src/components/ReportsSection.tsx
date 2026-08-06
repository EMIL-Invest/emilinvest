import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Eye, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface Report {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  quarter: string;
  year: number;
  created_at: string;
  uploaded_by: string;
}

const ReportsSection = () => {
  const [user, setUser] = useState<User | null>(null);
  const [hasRole, setHasRole] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quarter, setQuarter] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          checkUserRole(session.user.id);
        }, 0);
      } else {
        setHasRole(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      }
    });

    fetchReports();

    return () => subscription.unsubscribe();
  }, []);

  // Kun admin-brukere skal kunne laste opp og slette rapporter
  const checkUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");

    if (!error && data && data.length > 0) {
      setHasRole(true);
    } else {
      setHasRole(false);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("quarterly_reports")
        .select("*")
        .order("year", { ascending: false })
        .order("quarter", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setUploading(true);

    try {
      // Supabase Storage avviser nøkler med æ/ø/å, mellomrom og spesialtegn —
      // saniter filnavnet før opplasting.
      const safeName = file.name
        .replace(/[æÆ]/g, "ae").replace(/[øØ]/g, "o").replace(/[åÅ]/g, "a")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("reports")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("quarterly_reports")
        .insert({
          title,
          description: description || null,
          file_url: urlData.publicUrl,
          file_name: file.name,
          quarter,
          year: parseInt(year),
          uploaded_by: user.id,
        });

      if (insertError) throw insertError;

      toast({
        title: "Rapport lastet opp!",
        description: "Kvartalsrapporten er nå tilgjengelig.",
      });

      setTitle("");
      setDescription("");
      setQuarter("");
      setYear(new Date().getFullYear().toString());
      setFile(null);
      setShowUploadForm(false);
      fetchReports();
    } catch (error) {
      toast({
        title: "Feil ved opplasting",
        description: error instanceof Error ? error.message : "Ukjent feil",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (report: Report) => {
    if (!user || !hasRole) return;
    if (!window.confirm(`Er du sikker på at du vil slette «${report.title}»?`)) return;

    try {
      // Utled storage-nøkkelen fra URL-en. decodeURIComponent trengs for
      // eldre filer med prosent-enkodede tegn (f.eks. mellomrom som %20).
      const rawName = report.file_url.split("/").pop()?.split("?")[0];
      const fileName = rawName ? decodeURIComponent(rawName) : null;
      if (fileName) {
        const { error: removeError } = await supabase.storage.from("reports").remove([fileName]);
        if (removeError) {
          console.error("Kunne ikke slette filen fra storage:", removeError);
        }
      }

      const { error } = await supabase
        .from("quarterly_reports")
        .delete()
        .eq("id", report.id);

      if (error) throw error;

      toast({
        title: "Rapport slettet",
        description: "Kvartalsrapporten er fjernet.",
      });

      fetchReports();
    } catch (error) {
      toast({
        title: "Feil ved sletting",
        description: error instanceof Error ? error.message : "Ukjent feil",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="reports" className="py-24">
      <div className="section-container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Rapporter
          </Badge>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Kvartalsrapporter
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Last ned våre kvartalsrapporter for innsikt i porteføljeutviklingen
          </p>
        </div>

        {/* Upload button for members */}
        {user && hasRole && (
          <div className="flex justify-center mb-8">
            <Button onClick={() => setShowUploadForm(!showUploadForm)}>
              <Upload className="w-4 h-4 mr-2" />
              Last opp rapport
            </Button>
          </div>
        )}

        {/* Upload form */}
        {showUploadForm && user && hasRole && (
          <Card className="glass-card mb-8 max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="font-serif">Last opp kvartalsrapport</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tittel</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="F.eks. Kvartalsrapport Q1 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Kort beskrivelse av rapporten"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kvartal</Label>
                    <Select value={quarter} onValueChange={setQuarter} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg kvartal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Q1">Q1</SelectItem>
                        <SelectItem value="Q2">Q2</SelectItem>
                        <SelectItem value="Q3">Q3</SelectItem>
                        <SelectItem value="Q4">Q4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">År</Label>
                    <Input
                      id="year"
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      min="2020"
                      max="2030"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">PDF-fil</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={uploading || !quarter}>
                    {uploading ? "Laster opp..." : "Last opp"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowUploadForm(false)}
                  >
                    Avbryt
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Reports grid */}
        {loading ? (
          <div className="text-center text-muted-foreground">Laster rapporter...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-serif font-semibold text-foreground mb-2">
              Vi starter med kvartalsrapporter høsten 2026
            </p>
            <p className="text-muted-foreground max-w-md mx-auto">
              Den første rapporten publiseres her etter tredje kvartal — som
              alt annet vi gjør, helt åpent for alle.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="glass-card hover:shadow-elevated transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="outline">
                      {report.quarter} {report.year}
                    </Badge>
                  </div>
                  <h3 className="font-serif font-semibold text-foreground mb-2">
                    {report.title}
                  </h3>
                  {report.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {report.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Link
                      to={`/rapport?url=${encodeURIComponent(report.file_url)}&title=${encodeURIComponent(report.title)}`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Åpne
                      </Button>
                    </Link>
                    {user && hasRole && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(report)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ReportsSection;
