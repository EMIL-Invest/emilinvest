import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Check, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PortfolioHolding, Participant } from "@/hooks/useCompetition";
import {
  REGLER,
  HVORFOR_REGLER,
  KRAV_ANTALL_AKSJER,
  MAKSVEKT_PROSENT,
  MINSTE_FORSTEKJOP,
} from "@/lib/konkurranseregler";

/**
 * Regelknappen og førstegangsguiden på konkurransesiden.
 *
 * ReglerKnapp: alle reglene i en dialog, tilgjengelig rett fra forsiden
 * av konkurransen — også uten innlogging. Ingen skal måtte finne /vilkar
 * for å vite hva de er med på.
 *
 * PorteforljeStatus: banneret som følger en deltaker fra påmelding til
 * gyldig portefølje. Så lenge porteføljen har færre enn KRAV_ANTALL_AKSJER
 * aksjer, viser det hvor langt man er kommet og hva reglene krever — og at
 * avkastningen først begynner å telle når porteføljen er gyldig. Etterpå
 * krymper det til en bekreftelse.
 */

export const ReglerKnapp = ({ variant }: { variant?: "outline" | "default" }) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant || "outline"} size="sm">
          <BookOpen className="w-4 h-4 mr-2" />
          Reglene
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            Reglene i konkurransen
          </DialogTitle>
          <DialogDescription>
            Kort og fullstendig — dette er alt du trenger å vite.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-4 py-2">
          {REGLER.map((regel) => (
            <li key={regel.tittel} className="flex gap-3">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2.5"
                style={{ background: "hsl(var(--competition))" }}
              />
              <span className="leading-relaxed text-sm">
                <span className="text-foreground font-medium">{regel.tittel}.</span>{" "}
                <span className="text-muted-foreground">{regel.tekst}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
          {HVORFOR_REGLER}
        </p>
        <p className="text-xs text-muted-foreground">
          Reglene håndheves automatisk når du handler. Se også{" "}
          <Link
            to="/vilkar#regler"
            className="underline underline-offset-2"
            onClick={() => setOpen(false)}
          >
            vilkårene
          </Link>
          .
        </p>
      </DialogContent>
    </Dialog>
  );
};

interface StatusProps {
  participant: Participant;
  holdings: PortfolioHolding[];
}

export const PorteforljeStatus = ({ participant, holdings }: StatusProps) => {
  const antall = holdings.filter((h) => h.ticker !== "ASK").length;
  const gyldig = antall >= KRAV_ANTALL_AKSJER || !!participant.qualified_at;

  if (gyldig) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 mb-8">
        <CircleCheck className="w-5 h-5 text-primary flex-shrink-0" />
        <p className="text-sm text-foreground">
          <span className="font-medium">Porteføljen din er gyldig</span> — du
          rangeres på ledertavlen
          {participant.qualified_at && (
            <span className="text-muted-foreground">
              , og avkastningen din måles fra{" "}
              {new Date(participant.qualified_at).toLocaleDateString("no-NO", {
                day: "numeric",
                month: "long",
              })}
            </span>
          )}
          . Husk at du ikke kan selge deg under {KRAV_ANTALL_AKSJER} aksjer.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-md p-5 md:p-6 mb-8 text-primary-foreground"
      style={{ background: "hsl(var(--band))" }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
        <div className="flex-shrink-0">
          <p
            className="text-[0.65rem] uppercase tracking-[0.2em] mb-1"
            style={{ color: "hsl(var(--competition))" }}
          >
            Kom i gang
          </p>
          <p className="font-serif text-2xl">
            {antall} av {KRAV_ANTALL_AKSJER} aksjer
          </p>
          <div className="flex gap-1.5 mt-2" aria-hidden="true">
            {Array.from({ length: KRAV_ANTALL_AKSJER }).map((_, i) => (
              <span
                key={i}
                className="w-6 h-1.5 rounded-full"
                style={{
                  background:
                    i < antall
                      ? "hsl(var(--competition))"
                      : "hsl(var(--primary-foreground) / 0.2)",
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 text-sm leading-relaxed text-primary-foreground/80 space-y-1.5">
          <p>
            Kjøp{" "}
            <span className="font-medium text-primary-foreground">
              {KRAV_ANTALL_AKSJER - antall} aksje
              {KRAV_ANTALL_AKSJER - antall === 1 ? "" : "r"} til
            </span>{" "}
            i ulike selskaper, så er porteføljen gyldig og du rangeres på
            ledertavlen. Hvert førstegangskjøp må være på minst{" "}
            {MINSTE_FORSTEKJOP.toLocaleString("no-NO")} kr, og én aksje kan
            maks utgjøre {MAKSVEKT_PROSENT} % av porteføljen.
          </p>
          <p className="flex items-start gap-1.5">
            <Check
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: "hsl(var(--competition))" }}
            />
            <span>
              Avkastningen din <span className="font-medium text-primary-foreground">begynner å telle når porteføljen er gyldig</span>{" "}
              — så det lønner seg å komme i gang med én gang.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
