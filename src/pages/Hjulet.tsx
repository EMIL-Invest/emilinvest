import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Spinn hjulet - standspill: trykk på hjulet, 1 av 10 vinner en Red Bull.
 *
 * Utfallet trekkes FØR animasjonen starter (Math.random() < 0.1), og
 * hjulet spinner deretter til riktig sektor - ikke omvendt. Sektor 0 er
 * gevinsten; de ni andre gir ingenting. Gevinstbanneret viser klokkeslett,
 * slik at et skjermbilde ikke kan gjenbrukes på standen dagen etter.
 */

const ANTALL_SEKTORER = 10;
const SEKTOR_GRADER = 360 / ANTALL_SEKTORER;
const SPINNTID_MS = 4200;

/** Vinnersjanse: 1 av 10. */
const VINNERSJANSE = 0.1;

const beskrivBue = (fraGrad: number, tilGrad: number, r: number): string => {
  const rad = (g: number) => ((g - 90) * Math.PI) / 180;
  const x1 = 200 + r * Math.cos(rad(fraGrad));
  const y1 = 200 + r * Math.sin(rad(fraGrad));
  const x2 = 200 + r * Math.cos(rad(tilGrad));
  const y2 = 200 + r * Math.sin(rad(tilGrad));
  return `M 200 200 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
};

const Hjulet = () => {
  const [rotasjon, setRotasjon] = useState(0);
  const [fase, setFase] = useState<"klar" | "spinner" | "ferdig">("klar");
  const [vant, setVant] = useState(false);
  const [vunnetKl, setVunnetKl] = useState("");
  const ferdigTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spinn = () => {
    if (fase === "spinner") return;

    const vinner = Math.random() < VINNERSJANSE;
    const sektor = vinner ? 0 : 1 + Math.floor(Math.random() * (ANTALL_SEKTORER - 1));
    // Litt tilfeldig landing innenfor sektoren, men aldri på streken
    const slingring = Math.random() * 24 - 12;

    const naa = ((rotasjon % 360) + 360) % 360;
    const maal = (360 - (sektor * SEKTOR_GRADER + SEKTOR_GRADER / 2) + slingring + 360) % 360;
    const delta = ((maal - naa + 360) % 360) + 5 * 360;

    setVant(vinner);
    setFase("spinner");
    setRotasjon(rotasjon + delta);

    if (ferdigTimer.current) clearTimeout(ferdigTimer.current);
    ferdigTimer.current = setTimeout(() => {
      setVunnetKl(new Date().toLocaleTimeString("no-NO"));
      setFase("ferdig");
    }, SPINNTID_MS + 150);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <div className="section-container py-14 md:py-20 max-w-3xl">
          <Link
            to="/spill"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Alle spill
          </Link>

          <p className="eyebrow mb-6">Standspill</p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
            Spinn hjulet
          </h1>
          <div className="w-10 h-px bg-foreground/30 mb-8" />
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Trykk på hjulet. Én av ti sektorer gir en Red Bull - resten gir
            deg æren av å ha prøvd. Vinner du, viser du skjermen til oss på
            standen.
          </p>

          <div className="flex flex-col items-center">
            {/* Peker */}
            <div
              className="w-0 h-0 relative z-10"
              style={{
                borderLeft: "14px solid transparent",
                borderRight: "14px solid transparent",
                borderTop: "22px solid hsl(var(--competition))",
                marginBottom: "-6px",
              }}
              aria-hidden="true"
            />

            {/* Hjulet - hele flaten er knappen */}
            <button
              type="button"
              onClick={spinn}
              disabled={fase === "spinner"}
              aria-label="Spinn hjulet"
              className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 disabled:cursor-wait"
              style={{ width: "min(84vw, 26rem)", height: "min(84vw, 26rem)" }}
            >
              <svg
                viewBox="0 0 400 400"
                className="w-full h-full"
                style={{
                  transform: `rotate(${rotasjon}deg)`,
                  transition: `transform ${SPINNTID_MS}ms cubic-bezier(0.12, 0.62, 0.06, 1)`,
                  filter: "drop-shadow(0 10px 24px rgb(27 39 34 / 0.25))",
                }}
              >
                {Array.from({ length: ANTALL_SEKTORER }).map((_, i) => {
                  const fra = i * SEKTOR_GRADER;
                  const til = fra + SEKTOR_GRADER;
                  const gevinst = i === 0;
                  return (
                    <g key={i}>
                      <path
                        d={beskrivBue(fra, til, 192)}
                        fill={
                          gevinst
                            ? "hsl(38 92% 48%)"
                            : i % 2 === 0
                              ? "#31443B"
                              : "#24332C"
                        }
                        stroke="#F5F3F0"
                        strokeWidth="2"
                      />
                      <text
                        x="200"
                        y="52"
                        textAnchor="middle"
                        transform={`rotate(${fra + SEKTOR_GRADER / 2} 200 200)`}
                        fill={gevinst ? "#24332C" : "rgba(245,243,240,0.55)"}
                        fontSize={gevinst ? 15 : 13}
                        fontWeight={gevinst ? 700 : 400}
                        style={{ letterSpacing: gevinst ? "0.06em" : "0.2em" }}
                      >
                        {gevinst ? "RED BULL" : "•"}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {/* Navet ligger UTENPÅ svg-en, så det ikke roterer med hjulet */}
              <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-bold text-sm"
                style={{
                  width: "23%",
                  height: "23%",
                  background: "#F5F3F0",
                  border: "2px solid #DFDAD1",
                  color: "#24332C",
                  letterSpacing: "0.12em",
                }}
                aria-hidden="true"
              >
                {fase === "spinner" ? "…" : "TRYKK"}
              </span>
            </button>

            {/* Resultat */}
            <div className="mt-10 w-full max-w-md min-h-[7rem]" aria-live="polite">
              {fase === "ferdig" && vant && (
                <div
                  className="rounded-md p-6 text-center"
                  style={{ background: "hsl(38 92% 48%)", color: "#24332C" }}
                >
                  <p className="text-xs uppercase tracking-[0.22em] mb-1 font-bold">
                    Gevinst
                  </p>
                  <p className="font-serif text-3xl font-bold mb-1">
                    Du vant en Red Bull!
                  </p>
                  <p className="text-sm">
                    Vis denne skjermen til standen. Vunnet kl. {vunnetKl}.
                  </p>
                </div>
              )}
              {fase === "ferdig" && !vant && (
                <div
                  className="rounded-md p-6 text-center text-primary-foreground"
                  style={{ background: "hsl(var(--band))" }}
                >
                  <p className="font-serif text-2xl mb-1">Ikke denne gangen</p>
                  <p className="text-sm" style={{ color: "hsl(var(--primary-foreground) / 0.65)" }}>
                    Hjulet er nådeløst. Trykk for å prøve igjen.
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mt-6 text-center">
            Hvert spinn har 1 av 10 sjanse for gevinst, uavhengig av forrige
            spinn. Premier deles ut så langt lageret rekker.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Hjulet;
