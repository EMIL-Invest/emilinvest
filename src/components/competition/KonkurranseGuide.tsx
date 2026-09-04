import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Check, CircleAlert, CircleCheck, X } from "lucide-react";
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
 * Regelknappen og porteføljestatusen på konkurransesiden.
 *
 * ReglerKnapp: alle reglene i en dialog, tilgjengelig rett fra forsiden
 * av konkurransen - også uten innlogging. Ingen skal måtte finne /vilkar
 * for å vite hva de er med på.
 *
 * PorteforljeStatus: én kompakt knapp - grønn når porteføljen er gyldig,
 * rød når den ikke er det. Detaljene (kravlisten) ligger i en dialog bak
 * knappen, og er den rød står det i punkter under hva som mangler.
 * Erstatter de gamle tekstbannerne, som tok mye plass på siden.
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
            Kort og fullstendig - dette er alt du trenger å vite.
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
  const [open, setOpen] = useState(false);
  const antall = holdings.filter((h) => h.ticker !== "ASK").length;
  const gyldig = antall >= KRAV_ANTALL_AKSJER || !!participant.qualified_at;
  const mangler = Math.max(0, KRAV_ANTALL_AKSJER - antall);

  const krav = [
    {
      ok: gyldig,
      tekst: `Minst ${KRAV_ANTALL_AKSJER} ulike aksjer i porteføljen (du har ${antall})`,
    },
    {
      ok: true,
      tekst: `Førstekjøp på minst ${MINSTE_FORSTEKJOP.toLocaleString("no-NO")} kr per aksje - håndheves automatisk ved kjøp`,
    },
    {
      ok: true,
      tekst: `Maks ${MAKSVEKT_PROSENT} % av porteføljen i én aksje - håndheves automatisk ved kjøp`,
    },
  ];

  return (
    <div className="flex flex-col items-center mb-8">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className={
              gyldig
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }
          >
            {gyldig ? (
              <CircleCheck className="w-4 h-4 mr-2" />
            ) : (
              <CircleAlert className="w-4 h-4 mr-2" />
            )}
            {gyldig ? "Porteføljen er gyldig" : "Porteføljen er ikke gyldig"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {gyldig ? "Porteføljen er gyldig" : "Porteføljen er ikke gyldig ennå"}
            </DialogTitle>
            <DialogDescription>Krav til en gyldig portefølje:</DialogDescription>
          </DialogHeader>

          <ul className="space-y-2.5 py-1">
            {krav.map((k) => (
              <li key={k.tekst} className="flex items-start gap-2.5 text-sm">
                {k.ok ? (
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <span className={k.ok ? "text-muted-foreground" : "text-foreground"}>
                  {k.tekst}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
            {gyldig ? (
              <>
                Du rangeres på ledertavlen
                {participant.qualified_at && (
                  <>
                    , og avkastningen din måles fra{" "}
                    {new Date(participant.qualified_at).toLocaleDateString("no-NO", {
                      day: "numeric",
                      month: "long",
                    })}
                  </>
                )}
                . En gyldig portefølje kan ikke selges under {KRAV_ANTALL_AKSJER}{" "}
                aksjer igjen.
              </>
            ) : (
              <>
                Avkastningen din begynner først å telle når porteføljen er gyldig -
                så det lønner seg å komme i gang med én gang.
              </>
            )}
          </p>
        </DialogContent>
      </Dialog>

      {/* Rød status: hva som mangler, i punkter rett under knappen */}
      {!gyldig && (
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>
              Du eier {antall} av {KRAV_ANTALL_AKSJER} aksjer - kjøp{" "}
              <span className="font-medium text-foreground">
                {mangler} aksje{mangler === 1 ? "" : "r"} til
              </span>{" "}
              i ulike selskaper
            </span>
          </li>
        </ul>
      )}
    </div>
  );
};
