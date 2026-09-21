import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Forutsetninger } from "@/lib/analyse/db";
import { lagreForutsetninger } from "@/lib/analyse/db";
import { Seksjon, Tallfelt } from "./felles";

/**
 * Felles forutsetninger for alle analyser. Endres sjelden - typisk når
 * økonomiansvarlig oppdaterer risikofri rente ved semesterstart.
 */
const ForutsetningerPanel = ({ verdi, onLagret }: { verdi: Forutsetninger; onLagret: (f: Forutsetninger) => void }) => {
  const { toast } = useToast();
  const [f, setF] = useState<Forutsetninger>(verdi);
  const [lagrer, setLagrer] = useState(false);
  const n = (v: number | null, fallback: number) => (v === null ? fallback : v);

  const lagre = async () => {
    setLagrer(true);
    try {
      await lagreForutsetninger(f);
      onLagret(f);
      toast({ title: "Forutsetningene er lagret" });
    } catch (e) {
      toast({ title: "Lagring feilet", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setLagrer(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="font-serif text-2xl">Forutsetninger</h2>
        <p className="text-sm text-muted-foreground">Standardverdier nye verdsettelser starter med, og parametrene porteføljeanalysen bruker.</p>
      </div>

      <Seksjon tittel="Marked og kapitalkostnad" beskrivelse="CAPM: r = r_f + β × markedspremie. Disse to tallene styrer hele avkastningskravet.">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Tallfelt label="Risikofri rente" verdi={f.risikofriRente} onChange={(v) => setF({ ...f, risikofriRente: n(v, 0.04) })} prosent forklaring="10-årig norsk statsobligasjon er det vanlige valget for aksjer med lang horisont." kap="kap. 12.1" />
          <Tallfelt label="Markedspremie" verdi={f.markedspremie} onChange={(v) => setF({ ...f, markedspremie: n(v, 0.05) })} prosent forklaring="Forventet meravkastning for markedsporteføljen. Historisk 4-6 %; boka bruker ofte 5 %." kap="kap. 12.2" />
          <Tallfelt label="Selskapsskatt" verdi={f.skattesats} onChange={(v) => setF({ ...f, skattesats: n(v, 0.22) })} prosent desimaler={0} />
        </div>
      </Seksjon>

      <Seksjon tittel="Kurshistorikk" beskrivelse="Kapittel 12.3: minst to år med ukentlige data, eller fem år med månedlige. Standarden er tre år ukentlig.">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Markedsindeks (Yahoo-ticker)</Label>
            <Input className="h-9 mt-1" value={f.markedsindeks} onChange={(e) => setF({ ...f, markedsindeks: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Frekvens</Label>
            <Select value={f.frekvens} onValueChange={(v) => setF({ ...f, frekvens: v as Forutsetninger["frekvens"] })}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daglig">Daglig</SelectItem>
                <SelectItem value="ukentlig">Ukentlig</SelectItem>
                <SelectItem value="maanedlig">Månedlig</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Lengde</Label>
            <Select value={f.historikk} onValueChange={(v) => setF({ ...f, historikk: v as Forutsetninger["historikk"] })}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["1y", "2y", "3y", "5y", "10y"] as const).map((h) => <SelectItem key={h} value={h}>{h.replace("y", " år")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Seksjon>

      <Seksjon tittel="Konklusjonsregler" beskrivelse="Når skal modellene si kjøp eller selg? Tersklene bør være romslige - en DCF er sjelden presis innenfor ±10 %.">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Tallfelt label="Underpriset når oppside over" verdi={f.terskler.kjop} onChange={(v) => setF({ ...f, terskler: { ...f.terskler, kjop: n(v, 0.15) } })} prosent desimaler={0} />
          <Tallfelt label="Overpriset når oppside under" verdi={f.terskler.selg} onChange={(v) => setF({ ...f, terskler: { ...f.terskler, selg: n(v, -0.1) } })} prosent desimaler={0} />
        </div>
        <p className="text-xs text-muted-foreground mt-3 mb-2">Standardvekter for nye verdsettelser:</p>
        <div className="grid grid-cols-3 gap-3">
          <Tallfelt label="DCF" verdi={f.metodevekter.dcf} onChange={(v) => setF({ ...f, metodevekter: { ...f.metodevekter, dcf: n(v, 0.5) } })} prosent desimaler={0} />
          <Tallfelt label="Multipler" verdi={f.metodevekter.multipler} onChange={(v) => setF({ ...f, metodevekter: { ...f.metodevekter, multipler: n(v, 0.3) } })} prosent desimaler={0} />
          <Tallfelt label="Utbytte" verdi={f.metodevekter.utbytte} onChange={(v) => setF({ ...f, metodevekter: { ...f.metodevekter, utbytte: n(v, 0.2) } })} prosent desimaler={0} />
        </div>
      </Seksjon>

      <Button onClick={lagre} disabled={lagrer}><Save className="w-4 h-4 mr-1" />{lagrer ? "Lagrer..." : "Lagre forutsetninger"}</Button>
    </div>
  );
};

export default ForutsetningerPanel;
