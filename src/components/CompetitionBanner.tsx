import { Button } from "@/components/ui/button";
import { ArrowRight, Coins, TrendingUp, Gift, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useToppliste } from "@/hooks/useToppliste";
import { HovedpremieBilder, SitGavekort, FOTOKREDITT } from "@/components/competition/Premier";

/**
 * Konkurransen på forsiden — tre seksjoner kant til kant, ingen bokser
 * i bokser:
 *   1) Mørkegrønt felt med invitasjonen og live-topplisten
 *   2) Lyst faktabånd (startkapital, live kurser, premie, gratis)
 *   3) Lys premieseksjon (hovedpremien med bilder + månedspremien)
 * Topplisten er ekte: samme tall og kvalifiseringskrav som /konkurranse.
 */

const GULL = "hsl(var(--competition))";

const fakta = [
  { Ikon: Coins, verdi: "100 000 kr", merke: "Startkapital" },
  { Ikon: TrendingUp, verdi: "Live kurser", merke: "Fra Oslo Børs" },
  { Ikon: Gift, verdi: "Premie", merke: "Hver måned" },
  { Ikon: Users, verdi: "Gratis", merke: "For alle studenter" },
];

const prosent = (n: number) =>
  `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1).replace(".", ",")} %`;

const CompetitionBanner = () => {
  const { topp, laster } = useToppliste(3);

  // Stolpene skaleres mot den beste avkastningen. Ligger alle i minus,
  // gir stolper ingen mening, og da dropper vi dem.
  const maks = Math.max(...topp.map((t) => t.avkastning), 0);

  return (
    <>
      {/* ============ 1) Mørkegrønt felt — kant til kant ============ */}
      <section style={{ background: "hsl(var(--band))" }}>
        <div className="section-container py-16 md:py-24">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center">
            {/* Venstre: invitasjonen */}
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em]"
                style={{ borderColor: "hsl(var(--competition) / 0.4)", color: GULL }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: GULL }} />
                Aksjekonkurranse pågår
              </span>

              <h2
                className="font-serif text-4xl md:text-5xl leading-[1.08] mt-7 mb-6"
                style={{ color: "hsl(var(--primary-foreground))" }}
              >
                Kan du slå <span style={{ color: GULL }}>markedet</span> — og de
                andre?
              </h2>

              <p
                className="leading-relaxed max-w-lg mb-8"
                style={{ color: "hsl(var(--primary-foreground) / 0.72)" }}
              >
                Du får 100 000 kr i virtuell kapital, live kurser fra Oslo Børs
                og én jobb: bygge porteføljen som gir høyest avkastning. Beste
                avkastning hver måned vinner premie. Ingen forkunnskaper
                nødvendig.
              </p>

              <div className="flex flex-wrap items-center gap-6">
                <Button
                  asChild
                  size="lg"
                  className="group px-7 font-semibold bg-competition text-competition-foreground hover:bg-competition/90"
                  style={{ boxShadow: "0 10px 34px -12px hsl(var(--competition) / 0.8)" }}
                >
                  <Link to="/konkurranse">
                    Delta i konkurransen
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Link
                  to="/vilkar"
                  className="text-sm font-medium underline underline-offset-4 transition-colors"
                  style={{ color: "hsl(var(--primary-foreground) / 0.8)" }}
                >
                  Les reglene
                </Link>
              </div>
            </div>

            {/* Høyre: topplistekortet — det ene hvite kortet gir kontrast */}
            <div className="rounded-md bg-card p-6 md:p-8" style={{ boxShadow: "var(--shadow-soft)" }}>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-serif text-xl md:text-2xl text-foreground">
                  Toppliste denne måneden
                </h3>
                <span
                  className="text-[0.65rem] uppercase tracking-[0.2em] font-medium"
                  style={{ color: GULL }}
                >
                  Live
                </span>
              </div>
              <div className="h-px bg-border mt-4 mb-2" />

              {laster ? (
                <div className="py-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4 py-4">
                      <div className="h-3 w-6 rounded bg-secondary animate-pulse" />
                      <div className="h-3 flex-1 rounded bg-secondary animate-pulse" />
                      <div className="h-3 w-14 rounded bg-secondary animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : topp.length === 0 ? (
                <p className="text-sm text-muted-foreground leading-relaxed py-6">
                  Ingen har kvalifisert seg ennå denne måneden — det kreves fem
                  ulike aksjer for å bli rangert. Den første som er i gang,
                  ligger øverst.
                </p>
              ) : (
                <ol>
                  {topp.map((t, i) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-4 px-3 py-3.5 rounded-[4px]"
                      style={i === 0 ? { background: "hsl(var(--competition) / 0.1)" } : undefined}
                    >
                      <span
                        className="font-serif text-lg w-4 tabular-nums"
                        style={{ color: i === 0 ? GULL : "hsl(var(--muted-foreground))" }}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-foreground truncate">
                          {t.navn}
                        </span>
                        {/* Stolpen er relativ til lederen — den sier hvor stor
                            avstanden er, ikke hvor mye avkastning er i seg selv. */}
                        <span className="block h-[3px] rounded-full mt-1.5 bg-secondary overflow-hidden">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: maks > 0 ? `${Math.max((t.avkastning / maks) * 100, 0)}%` : "0%",
                              background: GULL,
                              opacity: i === 0 ? 1 : 0.55,
                            }}
                          />
                        </span>
                      </span>
                      <span
                        className={`font-serif text-lg tabular-nums ${
                          t.avkastning >= 0 ? "stock-positive" : "stock-negative"
                        }`}
                      >
                        {prosent(t.avkastning)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              <div className="border-t border-dashed border-border mt-2 pt-4 flex items-center gap-4 px-3">
                <span className="text-muted-foreground text-sm w-4">…</span>
                <span className="flex-1 text-sm text-muted-foreground">Din plass venter</span>
                <Link
                  to="/konkurranse"
                  className="text-sm font-semibold hover:underline underline-offset-4"
                  style={{ color: GULL }}
                >
                  Bli med
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 2) Faktabåndet — lyst, kant til kant ============ */}
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

      {/* ============ 3) Premiene — lys seksjon, kant til kant ============ */}
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
                150 kr til månedens beste avkastning — hver eneste måned.
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
