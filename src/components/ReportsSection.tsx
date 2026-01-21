import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Download, LogIn, LogOut, Trash2, Shield } from "lucide-react";
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
  const [isAdmin, setIsAdmin] = useState(false);
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
        checkUserRole(session.user.id);
      } else {
        setHasRole(false);
        setIsAdmin(false);
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

  const checkUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!error && data && data.length > 0) {
      setHasRole(true);
      setIsAdmin(data.some(r => r.role === "admin"));
    } else {
      setHasRole(false);
      setIsAdmin(false);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logget ut",
      description: "Du er nå logget ut.",
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("reports")
        .getPublicUrl(fileName);

      // Insert report record
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

      // Reset form
      setTitle("");
      setDescription("");
      setQuarter("");
      setYear(new Date().getFullYear().toString());
      setFile(null);
      setShowUploadForm(false);
      fetchReports();
    } catch (error: any) {
      toast({
        title: "Feil ved opplasting",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (report: Report) => {
    if (!user || user.id !== report.uploaded_by) return;

    try {
      // Delete from storage
      const fileName = report.file_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("reports").remove([fileName]);
      }

      // Delete record
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
    } catch (error: any) {
      toast({
        title: "Feil ved sletting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getQuarterLabel = (q: string) => {
    const labels: Record<string, string> = {
      Q1: "Q1 (Jan-Mar)",
      Q2: "Q2 (Apr-Jun)",
      Q3: "Q3 (Jul-Sep)",
      Q4: "Q4 (Okt-Des)",
    };
    return labels[q] || q;
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

        {/* Auth status and upload button */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {user && hasRole ? (
            <>
              <Button onClick={() => setShowUploadForm(!showUploadForm)}>
                <Upload className="w-4 h-4 mr-2" />
                Last opp rapport
              </Button>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    Administrasjon
                  </Button>
                </Link>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logg ut
              </Button>
            </>
          ) : user ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                Du har ikke tilgang til å laste opp rapporter.
              </p>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logg ut
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="outline">
                <LogIn className="w-4 h-4 mr-2" />
                Logg inn for medlemmer
              </Button>
            </Link>
          )}
        </div>

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
            <p className="text-muted-foreground">
              Ingen kvartalsrapporter er lastet opp ennå.
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
                    <a
                      href={report.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Last ned
                      </Button>
                    </a>
                    {user && user.id === report.uploaded_by && (
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
