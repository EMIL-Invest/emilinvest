import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import heroPhoto from "@/assets/hero-photo.jpg";

/**
 * Teller mykt opp/ned til ny verdi når den endres — NBIM-følelsen av at
 * saldoen «lever». Bruker requestAnimationFrame med ease-out.
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

const HeroSection = () => {
  const navigate = useNavigate();
  const { holdings, quotes, loading, lastUpdated, calculatePortfolioValue } = usePortfolioData();

  const portfolioValue = calculatePortfolioValue(holdings, quotes);
  const animatedValue = useCountUp(loading ? 0 : portfolioValue);

  // Dagens bevegelse: sum av dagsendring (NOK) per aksje vi eier
  const dayChange = holdings
    .filter((h) => h.holding_type === "stock")
    .reduce((sum, h) => {
      const q = quotes[h.ticker];
      return q ? sum + q.change * h.quantity : sum;
    }, 0);
  const dayChangePercent = portfolioValue > 0 ? (dayChange / (portfolioValue - dayChange)) * 100 : 0;
  const dayPositive = dayChange >= 0;

  const scrollTo = (selector: string) =>
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-16 overflow-hidden text-white"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Dekorative lysflater i blått */}
      <div className="absolute top-1/4 -right-24 w-[500px] h-[500px] bg-sky-400/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-24 w-[420px] h-[420px] bg-blue-300/10 rounded-full blur-3xl" />

      <div className="section-container relative z-10 w-full py-10">
        {/* Todelt topp: tallene på én side, komiteen på den andre.
            På mobil ligger bildet øverst, deretter saldoen. */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Gruppebildet */}
          <div className="order-first lg:order-last animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <img
              src={heroPhoto}
              alt="EMIL Invest-komiteen foran Hovedbygningen på NTNU"
              className="w-full h-auto rounded-2xl shadow-2xl ring-1 ring-white/20"
            />
          </div>

          {/* Saldoen og handlingsknappene */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm mb-8 animate-fade-up">
              <span className="text-sm font-medium text-white/90">
                Investeringskomiteen i EMIL — Energi- og miljøingeniørenes linjeforening
              </span>
            </div>

            <p
              className="text-sm md:text-base uppercase tracking-[0.25em] text-white/70 mb-4 animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              Porteføljens markedsverdi
            </p>
            <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
              {/* Vis alltid tallet — «0 kr» fra første render er penere enn en
                  tom plassholder mens dataene lastes. Telleren tar over derfra. */}
              <p className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-bold tracking-tight tabular-nums leading-none">
                {Math.round(animatedValue).toLocaleString("no-NO")}
                <span className="text-2xl md:text-3xl font-medium text-white/70 ml-3 align-baseline">kr</span>
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-5 text-sm md:text-base">
                {!loading && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium ${
                      dayPositive ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"
                    }`}
                  >
                    {dayPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {dayPositive ? "+" : ""}
                    {dayChange.toLocaleString("no-NO", { maximumFractionDigits: 0 })} kr i dag
                    {isFinite(dayChangePercent) && ` (${dayPositive ? "+" : ""}${dayChangePercent.toFixed(2)} %)`}
                  </span>
                )}
                {lastUpdated && (
                  <span className="text-white/50">
                    Oppdatert {lastUpdated.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </div>

            <p
              className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto lg:mx-0 mt-8 mb-8 animate-fade-up"
              style={{ animationDelay: "0.25s" }}
            >
              Vi er rundt 15 studenter som forvalter linjeforeningens midler — helt åpent.
              Følg hver investering vi gjør, lær med oss, og bli med i aksjekonkurransen vår.
            </p>

            <div
              className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start animate-fade-up"
              style={{ animationDelay: "0.35s" }}
            >
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 px-8 font-semibold"
                onClick={() => scrollTo("#portfolio")}
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Se porteføljen
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={() => scrollTo("#team")}
              >
                <Users className="w-5 h-5 mr-2" />
                Møt komiteen
              </Button>
              <Button
                size="lg"
                className="bg-competition hover:bg-competition/90 text-competition-foreground font-semibold"
                onClick={() => navigate("/konkurranse")}
              >
                <Trophy className="w-5 h-5 mr-2" />
                Bli med i konkurransen
              </Button>
            </div>
          </div>
        </div>

        {/* Nøkkeltall */}
        <div
          className="grid grid-cols-3 gap-8 mt-16 pt-10 border-t border-white/15 text-center animate-fade-up"
          style={{ animationDelay: "0.45s" }}
        >
          <div>
            <p className="text-3xl md:text-4xl font-serif font-bold">15+</p>
            <p className="text-sm text-white/60 mt-1">Aktive medlemmer</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-serif font-bold">100 %</p>
            <p className="text-sm text-white/60 mt-1">Åpen forvaltning</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-serif font-bold">2024</p>
            <p className="text-sm text-white/60 mt-1">Etablert</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
