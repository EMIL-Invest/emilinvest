import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BEGREPER } from "@/lib/begreper";
import { VARIGHET_SEK } from "@/config/invest-game/spillet";

/**
 * Spilloversikten — /spill er en liste over spillene, ikke et spill i seg
 * selv. Nye spill legges til i SPILL-listen under; kortene er identiske i
 * form, slik at siden tåler å vokse.
 */

interface Spilloppforing {
  til: string;
  merke: string;
  navn: string;
  beskrivelse: string;
  fakta: string[];
}

const SPILL: Spilloppforing[] = [
  {
    til: "/spill/begreper",
    merke: "Begreper",
    navn: "Snu kortet",
    beskrivelse:
      "Les begrepet, tenk selv, snu kortet. Fra IPO og P/E til MCP og LLM — ingen poeng, ingen tid.",
    fakta: [`${BEGREPER.length} kort`, "Alene", "Ingen tid"],
  },
  {
    til: "/borskrakket",
    merke: "Gruppekonkurranse",
    navn: "Børskrakket",
    beskrivelse:
      "Dere får 100 millioner og to minutter. Nyheter flytter markedet underveis — den som følger best med, vinner.",
    fakta: ["100 mill.", `${VARIGHET_SEK / 60} minutter`, "I grupper"],
  },
  {
    til: "/spill/hjulet",
    merke: "Standspill",
    navn: "Spinn hjulet",
    beskrivelse:
      "Trykk på hjulet og se hvor det lander. Én av ti sektorer gir en Red Bull — resten gir ingenting.",
    fakta: ["1 av 10 vinner", "Red Bull", "Ett trykk"],
  },
];

const SpillKort = ({ spill }: { spill: Spilloppforing }) => (
  <Link
    to={spill.til}
    className="block rounded-md overflow-hidden group transition-shadow hover:shadow-lg"
    style={{ background: "hsl(var(--band))" }}
  >
    <div className="h-1 w-full" style={{ background: "hsl(var(--competition))" }} />
    <div className="p-6 md:p-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p
            className="text-[0.65rem] uppercase tracking-[0.2em] mb-2"
            style={{ color: "hsl(var(--competition))" }}
          >
            {spill.merke}
          </p>
          <p
            className="font-serif text-2xl md:text-3xl mb-1"
            style={{ color: "hsl(var(--primary-foreground))" }}
          >
            {spill.navn}
          </p>
          <p
            className="text-sm leading-relaxed max-w-md"
            style={{ color: "hsl(var(--primary-foreground) / 0.65)" }}
          >
            {spill.beskrivelse}
          </p>
        </div>
        <ArrowRight
          className="w-6 h-6 flex-shrink-0 mt-1 transition-transform group-hover:translate-x-1"
          style={{ color: "hsl(var(--competition))" }}
        />
      </div>

      <div
        className="flex flex-wrap gap-x-6 gap-y-1 mt-6 pt-5"
        style={{ borderTop: "1px solid hsl(var(--primary-foreground) / 0.15)" }}
      >
        {spill.fakta.map((f) => (
          <span
            key={f}
            className="text-[0.68rem] uppercase tracking-[0.14em]"
            style={{ color: "hsl(var(--primary-foreground) / 0.55)" }}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  </Link>
);

const Spill = () => (
  <div className="min-h-screen">
    <Navbar />
    <main className="pt-16">
      <div className="section-container py-14 md:py-20 max-w-3xl">
        <p className="eyebrow mb-6">Spill</p>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
          Lær ved å prøve
        </h1>
        <div className="w-10 h-px bg-foreground/30 mb-8" />
        <p className="text-lg text-muted-foreground leading-relaxed mb-10">
          To spill om aksjer og investering — ett du kan ta alene når du vil, og
          ett vi bruker som gruppekonkurranse på arrangementer. Begge er åpne
          for alle, uten innlogging.
        </p>

        <div className="space-y-5">
          {SPILL.map((spill) => (
            <SpillKort key={spill.til} spill={spill} />
          ))}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mt-10">
          Ingenting i spillene er investeringsråd, og tallene i Børskrakket er
          en simulering — ikke et bilde av et virkelig marked. Har du en idé til
          et spill vi burde lage? Si fra på{" "}
          <a
            href="mailto:kontakt@emilinvest.no?subject=Idé%20til%20spill"
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

export default Spill;
