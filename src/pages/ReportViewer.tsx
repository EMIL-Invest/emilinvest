import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

// Kun rapporter fra vår egen Supabase-storage kan vises. Uten denne sjekken
// kunne hvem som helst lenke til /rapport?url=<ondsinnet side> og vise
// vilkårlig innhold under vårt domene (phishing).
const isAllowedReportUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    const supabaseHost = new URL(import.meta.env.VITE_SUPABASE_URL).host;
    return parsed.protocol === "https:" && parsed.host === supabaseHost;
  } catch {
    return false;
  }
};

const ReportViewer = () => {
  const [searchParams] = useSearchParams();
  const rawUrl = searchParams.get("url");
  const fileUrl = rawUrl && isAllowedReportUrl(rawUrl) ? rawUrl : null;
  const title = searchParams.get("title") || "Kvartalsrapport";

  if (!fileUrl) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 section-container text-center">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-4">
            Ingen rapport valgt
          </h1>
          <Link to="/#reports">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake til rapporter
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Header bar */}
      <div className="pt-16 border-b border-border bg-background/95 backdrop-blur-sm sticky top-16 z-40">
        <div className="section-container py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Link to="/#reports">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tilbake
                </Button>
              </Link>
              <h1 className="font-serif font-semibold text-foreground text-lg">
                {decodeURIComponent(title)}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Åpne i ny fane
                </Button>
              </a>
              <a href={fileUrl} download>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Last ned
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 bg-muted">
        <iframe
          src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
          className="w-full h-[calc(100vh-8rem)]"
          title={title}
        />
      </div>
    </div>
  );
};

export default ReportViewer;