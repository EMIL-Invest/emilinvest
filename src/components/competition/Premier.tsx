import { useState } from "react";
import { Gift, Utensils, Coffee, Puzzle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import middagBilde from "@/assets/premier/middag.jpg";
import britanniaBilde from "@/assets/premier/britannia.jpg";
import escapeBilde from "@/assets/premier/escape.jpg";

/**
 * Premiene i konkurransen — én kilde til sannhet, brukt to steder:
 *   - PremieKnapp: gullknappen ved siden av «Reglene» på /konkurranse,
 *     med alt innholdet i en dialog (tar ingen plass på siden).
 *   - Forsiden (CompetitionBanner) bruker HovedpremieBilder og
 *     SitGavekort direkte i det mørke konkurransefeltet.
 * Premiene ble vedtatt på komitémøtet 3. september.
 */

const GULL = "hsl(var(--competition))";

export const HOVEDPREMIER = [
  {
    bilde: middagBilde,
    alt: "Dekket bord for to med levende lys",
    Ikon: Utensils,
    tittel: "Treretters på To Rom og Kjøkken",
    under: "for 2 personer",
  },
  {
    bilde: britanniaBilde,
    alt: "Britannia Hotel i Trondheim",
    Ikon: Coffee,
    tittel: "Frokost på Britannia",
    under: "for 2 personer",
  },
  {
    bilde: escapeBilde,
    alt: "Låst dør med hengelås og kjetting",
    Ikon: Puzzle,
    tittel: "Escape room i Trondheim",
    under: "for opptil 4 personer",
  },
];

export const FOTOKREDITT =
  "Foto: PattayaPatrol, Ssu, Annatsach / Wikimedia Commons (CC BY-SA 4.0)";

/** Sit-gavekortet tegnet som et «utklippet» kort. */
export const SitGavekort = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 200 126"
    className={className || "w-32 flex-shrink-0 drop-shadow-md"}
    role="img"
    aria-label="Gavekort på Sit, 150 kroner"
  >
    <defs>
      <linearGradient id="sitkort" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0b3f8f" />
        <stop offset="1" stopColor="#1d6fe0" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="198" height="124" rx="12" fill="url(#sitkort)" />
    <circle cx="168" cy="-8" r="52" fill="#ffffff" opacity="0.08" />
    <circle cx="14" cy="120" r="38" fill="#ffffff" opacity="0.06" />
    <text x="16" y="30" fill="#ffffff" opacity="0.85" fontSize="11" letterSpacing="2.5" fontFamily="Calibri, sans-serif">
      GAVEKORT
    </text>
    <text x="16" y="76" fill="#ffffff" fontSize="34" fontWeight="bold" fontFamily="Cambria, serif">
      150,-
    </text>
    <text x="16" y="108" fill="#ffffff" opacity="0.9" fontSize="15" fontWeight="bold" fontFamily="Calibri, sans-serif">
      Sit
    </text>
    <rect x="150" y="92" width="34" height="22" rx="4" fill="#ffffff" opacity="0.22" />
  </svg>
);

/**
 * De tre hovedpremiene som bildekort. Tre varianter:
 *   "lys"      — kort med ramme på lys bakgrunn (dialogen)
 *   "moerk"    — hvit tekst uten kortbakgrunn (mørke flater)
 *   "kontrast" — bilde med mørkegrønn tekstfot (premieseksjonen på
 *                forsiden; footeren gir kontrast uten kortramme)
 */
export const HovedpremieBilder = ({
  moerk = false,
  variant,
}: {
  moerk?: boolean;
  variant?: "lys" | "moerk" | "kontrast";
}) => {
  const stil = variant || (moerk ? "moerk" : "lys");
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {HOVEDPREMIER.map((p) => (
        <div
          key={p.tittel}
          className={
            stil === "lys"
              ? "rounded-md border border-border bg-secondary/40 overflow-hidden"
              : "rounded-md overflow-hidden"
          }
          style={
            stil === "moerk"
              ? { background: "hsl(var(--primary-foreground) / 0.06)" }
              : undefined
          }
        >
          <img src={p.bilde} alt={p.alt} className="w-full aspect-[16/10] object-cover" />
          <div
            className={`text-sm ${stil === "kontrast" ? "p-3.5" : "p-2.5"}`}
            style={stil === "kontrast" ? { background: "hsl(var(--band))" } : undefined}
          >
            <p
              className={`font-medium leading-snug flex items-center gap-1.5 ${
                stil === "lys" ? "text-foreground" : ""
              }`}
              style={stil !== "lys" ? { color: "hsl(var(--primary-foreground))" } : undefined}
            >
              <p.Ikon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GULL }} />
              {p.tittel}
            </p>
            <p
              className={`text-xs mt-0.5 ${stil === "lys" ? "text-muted-foreground" : ""}`}
              style={stil !== "lys" ? { color: "hsl(var(--primary-foreground) / 0.6)" } : undefined}
            >
              {p.under}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Gullknappen «Premie» på konkurransesiden — alt premieinnholdet i en
 * dialog, så det ikke tar plass i selve konkurransen.
 */
export const PremieKnapp = () => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-competition text-competition-foreground hover:bg-competition/90">
          <Gift className="w-4 h-4 mr-2" />
          Premie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Dette kan du vinne</DialogTitle>
          <DialogDescription>Premier hver måned — og en hovedpremie 1. juni.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Månedspremien */}
          <div className="flex items-center gap-4">
            <SitGavekort className="w-32 sm:w-36 flex-shrink-0 drop-shadow-md" />
            <div className="text-sm leading-relaxed">
              <Badge className="bg-competition text-competition-foreground mb-1.5">Hver måned</Badge>
              <p className="font-medium">Gavekort på Sit · 150 kr</p>
              <p className="text-muted-foreground">Best avkastning den måneden vinner.</p>
            </div>
          </div>

          {/* Hovedpremien */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <Badge className="bg-competition text-competition-foreground flex-shrink-0 mt-0.5">1. juni</Badge>
              <p className="text-sm leading-relaxed">
                <span className="font-medium">Hovedpremien:</span>{" "}
                <span className="text-muted-foreground">vinneren velger én av tre —</span>
              </p>
            </div>
            <HovedpremieBilder />
            <p className="text-[10px] text-muted-foreground/70 leading-snug">{FOTOKREDITT}</p>
          </div>

          <p className="flex items-start gap-2 text-sm text-muted-foreground border-t border-border pt-3">
            <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: GULL }} />
            <span>
              <span className="font-medium text-foreground">Det lønner seg å bli med tidlig</span>{" "}
              — avkastningen din måles fra porteføljen er gyldig, så jo før du starter,
              jo lenger får avkastningen jobbe for deg.
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
