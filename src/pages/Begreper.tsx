import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Shuffle, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BEGREPER, KATEGORIER, type Kategori } from "@/lib/begreper";

/**
 * Snu kortet - begrepsspillet. Ligger på /spill/begreper; oversikten
 * over spill ligger på /spill.
 *
 * Ingen poeng, ingen tid, ingen framgang som lagres. Du snur kort til du
 * er lei. Det er hele greia: målet er å kjenne igjen ordene neste gang de
 * dukker opp i en analyse eller på et møte.
 */

type Valg = Kategori | "Alle";

/** Fisher-Yates. Vi stokker en indeksliste, ikke selve kortene. */
const stokk = (antall: number): number[] => {
  const rekke = Array.from({ length: antall }, (_, i) => i);
  for (let i = rekke.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rekke[i], rekke[j]] = [rekke[j], rekke[i]];
  }
  return rekke;
};

const Begreper = () => {
  const [valg, setValg] = useState<Valg>("Alle");
  const [posisjon, setPosisjon] = useState(0);
  const [snudd, setSnudd] = useState(false);

  const kortstokk = useMemo(
    () => (valg === "Alle" ? BEGREPER : BEGREPER.filter((b) => b.kategori === valg)),
    [valg]
  );

  const [rekkefolge, setRekkefolge] = useState<number[]>(() => stokk(BEGREPER.length));

  // Ny kategori = ny stokk, fra kort én.
  useEffect(() => {
    setRekkefolge(stokk(kortstokk.length));
    setPosisjon(0);
    setSnudd(false);
  }, [kortstokk.length, valg]);

  const kort = kortstokk[rekkefolge[posisjon]] ?? kortstokk[0];

  const gaTil = useCallback(
    (retning: 1 | -1) => {
      setSnudd(false);
      setPosisjon((p) => (p + retning + rekkefolge.length) % rekkefolge.length);
    },
    [rekkefolge.length]
  );

  const stokkOm = useCallback(() => {
    setRekkefolge(stokk(kortstokk.length));
    setPosisjon(0);
    setSnudd(false);
  }, [kortstokk.length]);

  // Tastatur: mellomrom snur, piltaster bytter kort.
  useEffect(() => {
    const lytt = (e: KeyboardEvent) => {
      const felt = (e.target as HTMLElement)?.tagName;
      if (felt === "INPUT" || felt === "TEXTAREA") return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setSnudd((s) => !s);
      } else if (e.key === "ArrowRight") {
        gaTil(1);
      } else if (e.key === "ArrowLeft") {
        gaTil(-1);
      }
    };
    window.addEventListener("keydown", lytt);
    return () => window.removeEventListener("keydown", lytt);
  }, [gaTil]);

  if (!kort) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <div className="section-container py-14 md:py-20 max-w-3xl">
          <Link
            to="/spill"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Alle spill
          </Link>
          <p className="eyebrow mb-6">Begreper</p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
            Snu kortet
          </h1>
          <div className="w-10 h-px bg-foreground/30 mb-8" />
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            {BEGREPER.length} begreper fra aksjeverdenen - og noen fra kunstig
            intelligens. Les ordet, tenk selv, og snu kortet for å se om du traff.
            Ingen poeng og ingen tid: du er ferdig når du er lei.
          </p>

          {/* Kategorivalg */}
          <div className="flex flex-wrap gap-2 mb-8">
            {(["Alle", ...KATEGORIER] as Valg[]).map((k) => {
              const aktiv = valg === k;
              return (
                <button
                  key={k}
                  onClick={() => setValg(k)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    aktiv
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>

          {/* Kortet. Selve snuingen er en 3D-rotasjon: to flater ligger oppå
              hverandre, den bakerste er forhåndsrotert 180 grader, og
              backface-visibility skjuler den som vender fra oss. */}
          <button
            type="button"
            onClick={() => setSnudd((s) => !s)}
            aria-label={snudd ? `Forklaring på ${kort.ord}. Trykk for å snu tilbake.` : `${kort.ord}. Trykk for å se forklaringen.`}
            className="w-full text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            style={{ perspective: "1600px" }}
          >
            <div
              className="relative h-[320px] md:h-[360px] transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: snudd ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Forside: begrepet */}
              <div
                className="absolute inset-0 rounded-md border border-border bg-card flex flex-col text-center px-6 py-8"
                style={{ backfaceVisibility: "hidden", boxShadow: "var(--shadow-soft)" }}
              >
                <p className="eyebrow">{kort.kategori}</p>
                <div className="flex-1 flex items-center justify-center">
                  <p className="font-serif text-4xl md:text-5xl text-foreground leading-tight">
                    {kort.ord}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Trykk for å snu</p>
              </div>

              {/* Bakside: forklaringen */}
              <div
                className="absolute inset-0 rounded-md flex flex-col text-center px-7 py-8 md:px-12"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  background: "hsl(var(--band))",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                <p
                  className="text-xs uppercase tracking-[0.18em]"
                  style={{ color: "hsl(var(--competition))" }}
                >
                  {kort.ord}
                </p>
                <div className="flex-1 flex items-center justify-center">
                  <p
                    className="text-lg md:text-xl leading-relaxed font-serif text-left"
                    style={{ color: "hsl(var(--primary-foreground))" }}
                  >
                    {kort.forklaring}
                  </p>
                </div>
                <p
                  className="text-xs"
                  style={{ color: "hsl(var(--primary-foreground) / 0.45)" }}
                >
                  Trykk for å snu tilbake
                </p>
              </div>
            </div>
          </button>

          {/* Kontroller */}
          <div className="flex items-center justify-between gap-4 mt-6">
            <Button variant="outline" size="sm" onClick={() => gaTil(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Forrige
            </Button>

            <p className="text-sm text-muted-foreground tabular-nums">
              Kort {posisjon + 1} av {kortstokk.length}
            </p>

            <Button variant="outline" size="sm" onClick={() => gaTil(1)}>
              Neste
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-8 pt-8 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setSnudd((s) => !s)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Snu kortet
            </Button>
            <Button variant="ghost" size="sm" onClick={stokkOm}>
              <Shuffle className="w-4 h-4 mr-2" />
              Stokk om
            </Button>
            <p className="text-xs text-muted-foreground ml-auto hidden sm:block">
              Mellomrom snur · piltaster bytter kort
            </p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mt-10">
            Forklaringene er ment som en pekepinn, ikke som fasit i en eksamen -
            og ingenting her er investeringsråd. Mangler et begrep du synes burde
            vært med? Si fra på{" "}
            <a
              href="mailto:kontakt@emilinvest.no?subject=Begrep%20til%20spillet"
              className="text-primary underline underline-offset-2"
            >
              kontakt@emilinvest.no
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Begreper;
