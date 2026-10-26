import { ArrowRight, Coins, TrendingUp, Gift, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { HovedpremieBilder, SitGavekort, FOTOKREDITT } from "@/components/competition/Premier";

/**
 * Mer om konkurransen på forsiden, rett under toppen. Invitasjonen og
 * topplisten bor nå i det grønne feltet i HeroSection; her ligger:
 *   1) Lyst faktabånd (startkapital, live kurser, premie, gratis)
 *   2) Lys premieseksjon (hovedpremien med bilder + månedspremien)
 */

const GULL = "hsl(var(--competition))";

const fakta = [
  { Ikon: Coins, verdi: "100 000 kr", merke: "Startkapital" },
  { Ikon: TrendingUp, verdi: "Live kurser", merke: "Fra flere børser" },
  { Ikon: Gift, verdi: "Premie", merke: "Hver måned" },
  { Ikon: Users, verdi: "Gratis", merke: "For alle studenter" },
];

const CompetitionBanner = () => {
  return (
    <>
      {/* ============ 1) Faktabåndet - lyst, kant til kant ============ */}
      <section className="bg-card border-b border-border">
        <div className="section-container py-7 md:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {fakta.map((f) => (
              <div key={f.merke} className="flex items-center gap-3.5">
                <f.Ikon className="w-6 h-6 flex-shrink-0 text-foreground/60" strokeWidth={1.5} />
                <div>
                  <p className="font-serif text-lg md:text-xl leading-none text-foreground">
                    {f.verdi}
                  </p>
                  <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground mt-1">
                    {f.merke}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 2) Premiene - lys seksjon, kant til kant ============ */}
      <section className="py-16 md:py-20">
        <div className="section-container">
          <div className="grid lg:grid-cols-[2fr_1fr] gap-12 lg:gap-16">
            {/* Hovedpremien */}
            <div>
              <p className="text-xs uppercase tracking-[0.22em] font-medium mb-3" style={{ color: GULL }}>
                Hovedpremie 1. juni
              </p>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-7">
                Vinneren velger én av tre
              </h2>
              <HovedpremieBilder variant="kontrast" />
            </div>

            {/* Månedspremien */}
            <div className="lg:border-l lg:border-border lg:pl-12">
              <p className="text-xs uppercase tracking-[0.22em] font-medium mb-3" style={{ color: GULL }}>
                Månedspremie
              </p>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-7">
                Sit-gavekort
              </h2>
              <SitGavekort className="w-40 drop-shadow-md" />
              <p className="text-sm text-muted-foreground leading-relaxed mt-5 max-w-xs">
                150 kr til månedens beste avkastning - hver eneste måned.
              </p>
              <Link
                to="/konkurranse"
                className="inline-flex items-center gap-2 text-sm font-medium mt-6 hover:underline underline-offset-4 text-foreground group"
              >
                Se alle premier
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60 leading-snug mt-6">{FOTOKREDITT}</p>
        </div>
      </section>
    </>
  );
};

export default CompetitionBanner;
