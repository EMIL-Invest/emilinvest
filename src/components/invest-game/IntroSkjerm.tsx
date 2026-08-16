import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hentLedertavle } from "@/lib/invest-game/ledertavle";
import { formatPct } from "@/lib/invest-game/motor";

interface IntroSkjermProps {
  forrigeNavn: string;
  onStart: (gruppenavn: string) => void;
}

const IntroSkjerm = ({ forrigeNavn, onStart }: IntroSkjermProps) => {
  const [navn, setNavn] = useState(forrigeNavn);
  const tavle = hentLedertavle();

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    if (navn.trim()) onStart(navn.trim());
  };

  return (
    <div className="section-container py-14 md:py-20 max-w-2xl">
      <p className="eyebrow mb-6">EMIL Invest</p>
      <h1 className="font-serif text-4xl md:text-6xl text-foreground mb-6">Børskrakket</h1>
      <div className="w-10 h-px bg-foreground/30 mb-8" />

      <div className="text-lg text-muted-foreground leading-relaxed space-y-4 mb-10">
        <p>
          Dere har <span className="text-foreground">100 millioner kroner</span> og{" "}
          <span className="text-foreground">tre minutter</span>. Kjøp og selg investeringer
          mens markedet beveger seg.
        </p>
        <p>
          Følg med på nyhetene — de gir hint om hva som kommer til å skje. Gruppen med
          høyest avkastning vinner.
        </p>
      </div>

      <form onSubmit={start} className="flex flex-col sm:flex-row gap-3 sm:items-end mb-14">
        <div className="flex-1">
          <Label htmlFor="gruppenavn">Gruppenavn</Label>
          <Input
            id="gruppenavn"
            value={navn}
            onChange={(e) => setNavn(e.target.value)}
            placeholder="f.eks. EMIL 3"
            maxLength={40}
            autoFocus
            className="mt-1.5"
          />
        </div>
        <Button type="submit" size="lg" disabled={!navn.trim()} className="px-7">
          Start konkurransen
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>

      {tavle.length > 0 && (
        <div
          className="rounded-md border border-border bg-card p-6"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <p className="eyebrow mb-4">Ledertavlen så langt</p>
          <ol className="space-y-2">
            {tavle.slice(0, 5).map((r, i) => (
              <li key={`${r.navn}-${r.tidspunkt}`} className="flex items-baseline gap-4">
                <span className="font-serif text-lg text-muted-foreground w-5 tabular-nums">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-foreground truncate">
                  {r.navn}
                </span>
                <span
                  className={`font-serif text-lg tabular-nums ${
                    r.avkastningPct >= 0 ? "stock-positive" : "stock-negative"
                  }`}
                >
                  {formatPct(r.avkastningPct)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default IntroSkjerm;
