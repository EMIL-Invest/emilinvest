import { ReactNode, useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { prosent } from "@/lib/finans/konklusjon";

/**
 * Små byggeklosser som brukes over hele analyseverktøyet: tallfelt som
 * tåler norsk komma og prosent, forklaringsikon med pensumreferanse,
 * nøkkeltall-fliser og seksjonsoverskrifter.
 */

/** Info-ikon med forklaring i tooltip. `kap` er kapittelreferansen i Berk & DeMarzo. */
export const Forklar = ({ tekst, kap }: { tekst: string; kap?: string }) => (
  <Tooltip delayDuration={150}>
    <TooltipTrigger asChild>
      <button type="button" className="inline-flex text-muted-foreground hover:text-foreground align-middle ml-1" aria-label="Forklaring">
        <Info className="w-3.5 h-3.5" />
      </button>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs text-xs leading-relaxed">
      {tekst}
      {kap && <span className="block mt-1 text-muted-foreground">Berk &amp; DeMarzo, {kap}</span>}
    </TooltipContent>
  </Tooltip>
);

const tilTekst = (v: number | null, prosentfelt: boolean, desimaler: number): string => {
  if (v === null || !isFinite(v)) return "";
  const x = prosentfelt ? v * 100 : v;
  return x.toLocaleString("no-NO", { maximumFractionDigits: desimaler, useGrouping: false });
};

const fraTekst = (t: string, prosentfelt: boolean): number | null => {
  const r = t.trim().replace(/\s/g, "").replace(",", ".");
  if (r === "" || r === "-") return null;
  const n = Number(r);
  if (!isFinite(n)) return null;
  return prosentfelt ? n / 100 : n;
};

interface TallfeltProps {
  label: string;
  verdi: number | null;
  onChange: (v: number | null) => void;
  /** Vises og skrives som prosent (8,5), lagres som desimal (0,085). */
  prosent?: boolean;
  suffix?: string;
  desimaler?: number;
  forklaring?: string;
  kap?: string;
  disabled?: boolean;
  className?: string;
  steg?: number;
}

/**
 * Tallfelt som lar brukeren skrive fritt (komma, mellomrom) og først
 * oppdaterer modellen når verdien er et gyldig tall. Viser prosent som
 * prosent, men modellen får alltid desimaltall.
 */
export const Tallfelt = ({ label, verdi, onChange, prosent: erProsent = false, suffix, desimaler = 2, forklaring, kap, disabled, className }: TallfeltProps) => {
  const [tekst, setTekst] = useState(tilTekst(verdi, erProsent, desimaler));
  const [fokus, setFokus] = useState(false);
  useEffect(() => {
    if (!fokus) setTekst(tilTekst(verdi, erProsent, desimaler));
  }, [verdi, erProsent, desimaler, fokus]);
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground flex items-center">
        {label}
        {forklaring && <Forklar tekst={forklaring} kap={kap} />}
      </Label>
      <div className="relative mt-1">
        <Input
          inputMode="decimal"
          value={tekst}
          disabled={disabled}
          onFocus={() => setFokus(true)}
          onBlur={() => {
            setFokus(false);
            setTekst(tilTekst(verdi, erProsent, desimaler));
          }}
          onChange={(e) => {
            setTekst(e.target.value);
            const n = fraTekst(e.target.value, erProsent);
            if (n !== null || e.target.value.trim() === "") onChange(n);
          }}
          className={`h-9 tabular-nums ${suffix || erProsent ? "pr-10" : ""}`}
        />
        {(suffix || erProsent) && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {erProsent ? "%" : suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export const Seksjon = ({ tittel, beskrivelse, children, hoyre }: { tittel: string; beskrivelse?: string; children: ReactNode; hoyre?: ReactNode }) => (
  <section className="rounded-md border border-border bg-card">
    <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
      <div>
        <h3 className="font-serif text-lg text-foreground">{tittel}</h3>
        {beskrivelse && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{beskrivelse}</p>}
      </div>
      {hoyre}
    </header>
    <div className="px-5 py-4">{children}</div>
  </section>
);

/** Nøkkeltall-flis: stort tall, liten etikett, valgfri fargekode for retning. */
export const Nokkeltall = ({ etikett, verdi, under, tone = "noytral", stor }: { etikett: string; verdi: string; under?: string; tone?: "god" | "daarlig" | "noytral"; stor?: boolean }) => {
  const farge = tone === "god" ? "stock-positive" : tone === "daarlig" ? "stock-negative" : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-background px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{etikett}</p>
      <p className={`font-serif ${stor ? "text-3xl" : "text-2xl"} tabular-nums mt-1 ${farge}`}>{verdi}</p>
      {under && <p className="text-xs text-muted-foreground mt-0.5">{under}</p>}
    </div>
  );
};

/** Prosent med fortegn og farge. */
export const Retning = ({ v, desimaler = 1 }: { v: number | null | undefined; desimaler?: number }) => {
  if (v === null || v === undefined || !isFinite(v)) return <span className="text-muted-foreground">-</span>;
  return <span className={v >= 0 ? "stock-positive" : "stock-negative"}>{prosent(v, desimaler)}</span>;
};

