import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TopLinje from "@/components/invest-game/TopLinje";
import SelskapsKort from "@/components/invest-game/SelskapsKort";
import HandelsDialog, { type Handel } from "@/components/invest-game/HandelsDialog";
import { NyhetsBanner, NyhetsFeed } from "@/components/invest-game/Nyheter";
import IntroSkjerm from "@/components/invest-game/IntroSkjerm";
import ResultatSkjerm from "@/components/invest-game/ResultatSkjerm";
import DebugPanel from "@/components/invest-game/DebugPanel";
import { SELSKAPER, VARIGHET_SEK, type Nyhet } from "@/config/invest-game/spillet";
import {
  aktivBanner,
  avkastningPct,
  kjop,
  kurs,
  nyPortefolje,
  publiserteNyheter,
  selg,
  totalverdi,
  type Portefolje,
} from "@/lib/invest-game/motor";
import { lagreResultat } from "@/lib/invest-game/ledertavle";

/**
 * Børskrakket — femminutterskonkurransen.
 *
 * Én sentral spillklokke styrer alt: tSek regnes fra Date.now() minus
 * starttidspunktet, aldri fra antall renders eller intervall-ticks.
 * Kursene, nedtellingen og nyhetene er alle rene funksjoner av tSek, så
 * en hakkete nettleser eller en fane som mister fokus forskyver
 * ingenting — neste render lander bare på riktig sted på tidslinjen.
 */

type Fase = "intro" | "spill" | "resultat";

const Borskrakket = () => {
  const [fase, setFase] = useState<Fase>("intro");
  const [gruppenavn, setGruppenavn] = useState("");
  const [portefolje, setPortefolje] = useState<Portefolje>(nyPortefolje);
  const [handel, setHandel] = useState<Handel | null>(null);

  // Spillklokken
  const [startetTid, setStartetTid] = useState<number | null>(null);
  const [pausetVed, setPausetVed] = useState<number | null>(null);
  const [pausetSum, setPausetSum] = useState(0);
  const [, setPuls] = useState(0); // trigger re-render; tiden leses alltid fra Date.now()

  // Debug (kun med ?debug i URL-en)
  const debugAktiv = new URLSearchParams(useLocation().search).has("debug");
  const [manuellNyhet, setManuellNyhet] = useState<{ nyhet: Nyhet; til: number } | null>(null);

  const [lagretTidspunkt, setLagretTidspunkt] = useState("");
  const lagretRef = useRef(false);

  /** Sekunder inn i spillet akkurat nå — den ene kilden til sannhet. */
  const naaTSek = useCallback((): number => {
    if (startetTid === null) return 0;
    const naa = pausetVed ?? Date.now();
    return Math.min((naa - startetTid - pausetSum) / 1000, VARIGHET_SEK);
  }, [startetTid, pausetVed, pausetSum]);

  const tSek = naaTSek();

  // Puls: fire oppdateringer i sekundet er nok til at alt føles live.
  useEffect(() => {
    if (fase !== "spill" || pausetVed !== null) return;
    const id = window.setInterval(() => setPuls((p) => p + 1), 250);
    return () => window.clearInterval(id);
  }, [fase, pausetVed]);

  // Når tiden er ute: frys, lagre resultatet én gang, vis resultatskjermen.
  useEffect(() => {
    if (fase !== "spill" || tSek < VARIGHET_SEK) return;
    if (!lagretRef.current) {
      lagretRef.current = true;
      const tidspunkt = new Date().toISOString();
      setLagretTidspunkt(tidspunkt);
      lagreResultat({
        navn: gruppenavn,
        avkastningPct: avkastningPct(portefolje, VARIGHET_SEK),
        sluttverdi: totalverdi(portefolje, VARIGHET_SEK),
        tidspunkt,
      });
    }
    setHandel(null);
    setFase("resultat");
  }, [fase, tSek, gruppenavn, portefolje]);

  const start = (navn: string) => {
    setGruppenavn(navn);
    setPortefolje(nyPortefolje());
    setPausetVed(null);
    setPausetSum(0);
    setManuellNyhet(null);
    lagretRef.current = false;
    setStartetTid(Date.now());
    setFase("spill");
  };

  const tilbakeTilStart = () => {
    setFase("intro");
    setStartetTid(null);
    setPortefolje(nyPortefolje());
  };

  // Handel skjer til kursen i KLIKKØYEBLIKKET, ikke ved siste render.
  const utforKjop = (belop: number) => {
    if (!handel) return;
    const t = naaTSek();
    if (t >= VARIGHET_SEK) return;
    setPortefolje((p) => kjop(p, handel.selskap, belop, t));
    setHandel(null);
  };

  const utforSalg = (andel: number) => {
    if (!handel) return;
    const t = naaTSek();
    if (t >= VARIGHET_SEK) return;
    setPortefolje((p) => selg(p, handel.selskap, andel, t));
    setHandel(null);
  };

  // Debug-hjelpere
  const hoppTil = (sek: number) => {
    setPausetVed(null);
    setPausetSum(0);
    setStartetTid(Date.now() - sek * 1000);
  };
  const pauseToggle = () => {
    if (pausetVed === null) {
      setPausetVed(Date.now());
    } else {
      setPausetSum((sum) => sum + Date.now() - pausetVed);
      setPausetVed(null);
    }
  };

  const banner =
    manuellNyhet && Date.now() < manuellNyhet.til
      ? manuellNyhet.nyhet
      : fase === "spill"
        ? aktivBanner(tSek)
        : null;

  const handelLaast = fase !== "spill" || tSek >= VARIGHET_SEK;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        {fase === "intro" && <IntroSkjerm forrigeNavn={gruppenavn} onStart={start} />}

        {fase === "spill" && (
          <>
            <TopLinje
              tSek={tSek}
              totalverdi={totalverdi(portefolje, tSek)}
              avkastning={avkastningPct(portefolje, tSek)}
              kontanter={portefolje.kontanter}
            />
            <NyhetsBanner nyhet={banner} />

            <div className="section-container py-6 md:py-8">
              <div className="grid lg:grid-cols-[2.4fr_1fr] gap-6 items-start">
                <div className="grid sm:grid-cols-2 gap-4">
                  {SELSKAPER.map((selskap) => (
                    <SelskapsKort
                      key={selskap.id}
                      selskap={selskap}
                      tSek={tSek}
                      post={portefolje.poster[selskap.id]}
                      handelLaast={handelLaast}
                      onKjop={() => setHandel({ selskap, modus: "kjop" })}
                      onSelg={() => setHandel({ selskap, modus: "selg" })}
                    />
                  ))}
                </div>
                <div className="lg:sticky lg:top-40">
                  <NyhetsFeed nyheter={publiserteNyheter(tSek)} />
                </div>
              </div>
            </div>

            <HandelsDialog
              handel={handel}
              kontanter={portefolje.kontanter}
              posisjonsverdi={
                handel
                  ? (portefolje.poster[handel.selskap.id]?.antall ?? 0) * kurs(handel.selskap, tSek)
                  : 0
              }
              kursNaa={handel ? kurs(handel.selskap, tSek) : 0}
              onKjop={utforKjop}
              onSelg={utforSalg}
              onLukk={() => setHandel(null)}
            />
          </>
        )}

        {fase === "resultat" && (
          <ResultatSkjerm
            portefolje={portefolje}
            gruppenavn={gruppenavn}
            lagretTidspunkt={lagretTidspunkt}
            onSpillIgjen={tilbakeTilStart}
          />
        )}

        {debugAktiv && fase === "spill" && (
          <DebugPanel
            tSek={tSek}
            pauset={pausetVed !== null}
            onHoppTil={hoppTil}
            onPauseToggle={pauseToggle}
            onReset={tilbakeTilStart}
            onTriggNyhet={(nyhet) => setManuellNyhet({ nyhet, til: Date.now() + 10_000 })}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Borskrakket;
