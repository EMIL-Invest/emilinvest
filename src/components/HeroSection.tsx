import { useEffect, useRef, useState } from "react";
import { ArrowRight, Users, LineChart, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import heroPhoto from "@/assets/hero-photo.jpg";

/**
 * Teller mykt opp/ned til ny verdi når den endres.
 * Bruker requestAnimationFrame med ease-out.
 */
const useCountUp = (target: number, durationMs = 1400): number => {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!isFinite(target)) return;
    const from = fromRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (target - from) * eased;
      setValue(current);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = target;
    };
  }, [target, durationMs]);

  return value;
};

const stats = [
  {
    icon: Users,
    value: "15+",
    label: "Aktive medlemmer",
    description: "Engasjerte studenter med lidenskap for investeringer",
  },
  {
    icon: LineChart,
    value: "100 %",
    label: "Åpen forvaltning",
    description: "Full innsikt i våre investeringer og beslutninger",
  },
  {
    icon: CalendarDays,
    value: "2024",
    label: "Etablert",
    description: "Bygget på kunnskap, åpenhet og fellesskap",
  },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const { holdings, quotes, loading, calculatePortfolioValue } = usePortfolioData();

  const portfolioValue = calculatePortfolioValue(holdings, quotes);
  const animatedValue = useCountUp(loading ? 0 : portfolioValue);

  // Dagens bevegelse: sum av dagsendring (NOK) per aksje vi eier
  const dayChange = holdings
    .filter((h) => h.holding_type === "stock")
    .reduce((sum, h) => {
      const q = quotes[h.ticker];
      return q ? sum + q.change * h.quantity : sum;
    }, 0);
  const dayPositive = dayChange >= 0;

  const scrollTo = (selector: string) =>
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="home" className="pt-16">
      {/* Øvre del: tekst til venstre, gruppebildet til høyre */}
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-14 md:py-20">
          <div className="animate-fade-up">
            <p className="eyebrow mb-6">Investeringskomiteen i EMIL</p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.08] text-foreground mb-7">
              Energi- og miljø&shy;ingeniørenes linjeforening
            </h1>
            <div className="w-10 h-px bg-foreground/30 mb-7" />
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-4">
              Vi forvalter linjeforeningens midler med et langsiktig perspektiv.
              Følg vår portefølje, se våre investeringer og bli kjent med oss.
            </p>

            {/* Dagens verdi — nedtonet, som en del av beskrivelsen */}
            <p className="text-sm text-muted-foreground tabular-nums mb-10">
              Porteføljens verdi i dag:{" "}
              <span className="font-semibold text-foreground">
                {Math.round(animatedValue).toLocaleString("no-NO")} kr
              </span>
              {!loading && (
                <span className={dayPositive ? "stock-positive" : "stock-negative"}>
                  {" "}
                  ({dayPositive ? "+" : ""}
                  {dayChange.toLocaleString("no-NO", { maximumFractionDigits: 0 })} kr i dag)
                </span>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" className="px-7" onClick={() => scrollTo("#portfolio")}>
                Se porteføljen
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-7 border-foreground/25 bg-transparent text-foreground hover:bg-foreground/5"
                onClick={() => scrollTo("#team")}
              >
                Møt komiteen
              </Button>
              <Button
                size="lg"
                className="group px-7 bg-competition text-competition-foreground hover:bg-competition/90 font-semibold"
                onClick={() => navigate("/konkurranse")}
              >
                Bli med i konkurransen
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <img
              src={heroPhoto}
              alt="EMIL Invest-komiteen foran Hovedbygningen på NTNU"
              className="w-full h-auto rounded-md"
              style={{ boxShadow: "var(--shadow-card)" }}
            />
          </div>
        </div>
      </div>

      {/* Nøkkeltall-bånd i dyp grønn */}
      <div style={{ background: "hsl(var(--band))" }} className="text-white">
        <div className="section-container">
          <div className="grid md:grid-cols-3">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex items-center gap-5 py-9 md:py-12 md:px-10 ${
                  i > 0 ? "border-t md:border-t-0 md:border-l border-white/15" : ""
                } ${i === 0 ? "md:pl-0" : ""}`}
              >
                <div className="w-14 h-14 rounded-full border border-white/25 flex items-center justify-center flex-shrink-0">
                  <stat.icon className="w-6 h-6 text-white/80" />
                </div>
                <div>
                  <p className="font-serif text-3xl md:text-4xl leading-none mb-1">{stat.value}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/80 mb-1.5">
                    {stat.label}
                  </p>
                  <p className="text-sm text-white/55 leading-snug">{stat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
