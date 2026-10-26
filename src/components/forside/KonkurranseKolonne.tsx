import { Link } from "react-router-dom";
import { useToppliste } from "@/hooks/useToppliste";
import { useMinDeltaker } from "@/hooks/useMinDeltaker";
import { KRAV_ANTALL_AKSJER } from "@/hooks/useCompetition";

/**
 * Konkurransen i det grønne feltet på forsiden: invitasjon, topp 3 denne
 * måneden og den innloggedes egen plass. Topplisten er ekte - samme tall og
 * kvalifiseringskrav som /konkurranse.
 */

const prosent = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1).replace(".", ",")} %`;

const maaned = new Date().toLocaleDateString("no-NO", { month: "long" });

const KonkurranseKolonne = () => {
  const { topp, laster, finnPlass } = useToppliste(3);
  const { deltakerId, innlogget } = useMinDeltaker();
  const min = finnPlass(deltakerId);
  const erPaaToppen = !!deltakerId && topp.some((t) => t.id === deltakerId);

  // Den innloggedes egen rad under topp 3, i samme form som listen
  let minRad: { plass: string; tekst: string; verdi: string | null; positiv: boolean } | null = null;
  if (!laster) {
    if (min && min.kvalifisert && min.plass !== null && !erPaaToppen)
      minRad = {
        plass: String(min.plass),
        tekst: `Din plass av ${min.antallRangerte}`,
        verdi: prosent(min.avkastning),
        positiv: min.avkastning >= 0,
      };
    else if (min && !min.kvalifisert) {
      const mangler = KRAV_ANTALL_AKSJER - min.antallAksjer;
      minRad = { plass: "–", tekst: `Kjøp ${mangler} ${mangler === 1 ? "aksje" : "aksjer"} til for å bli rangert`, verdi: null, positiv: true };
    } else if (innlogget && !deltakerId) minRad = { plass: "–", tekst: "Du er ikke med ennå", verdi: null, positiv: true };
  }

  return (
    <div className="border-t-2 pt-6" style={{ borderColor: "hsl(var(--competition))" }}>
      <h2 className="font-serif text-4xl md:text-[44px] leading-[1.05] text-white">Aksjekonkurransen</h2>
      <p className="text-[16.5px] leading-relaxed text-white/75 mt-3 mb-6 max-w-md">
        Start med 100 000 kr i virtuell kapital, bygg din egen portefølje og se om du slår oss. Beste
        avkastning hver måned vinner premie.
      </p>

      <p className="text-sm text-white/55 mb-1">Ledere i {maaned}</p>
      {laster ? (
        <div className="py-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-11 border-t border-white/15 flex items-center">
              <div className="h-3 w-full rounded bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
      ) : topp.length === 0 ? (
        <p className="text-sm text-white/70 border-t border-white/15 py-4 leading-relaxed">
          Ingen er rangert ennå denne måneden. Det kreves {KRAV_ANTALL_AKSJER} ulike aksjer, så den første som
          er i gang, havner øverst.
        </p>
      ) : (
        <ol>
          {topp.map((t, i) => (
            <li key={t.id} className="flex items-baseline gap-4 py-2.5 border-t border-white/15 text-[15px] text-white">
              <span
                className="w-7 font-serif text-2xl leading-none tabular-nums"
                style={i === 0 ? { color: "hsl(var(--competition))" } : { opacity: 0.55 }}
              >
                {i + 1}
              </span>
              <span className="flex-1 min-w-0 truncate">
                {t.navn}
                {t.id === deltakerId && (
                  <span className="ml-2 text-xs font-semibold" style={{ color: "hsl(var(--competition))" }}>
                    deg
                  </span>
                )}
              </span>
              <span className="tabular-nums">{prosent(t.avkastning)}</span>
            </li>
          ))}
        </ol>
      )}
      {minRad && (
        <Link
          to="/konkurranse"
          className="group flex items-baseline gap-4 mt-2 py-2.5 px-3 -mx-3 border-l-2 bg-white/[0.06] text-[15px] text-white transition-colors hover:bg-white/[0.11]"
          style={{ borderColor: "hsl(var(--competition))" }}
        >
          <span className="w-7 font-serif text-2xl leading-none tabular-nums">{minRad.plass}</span>
          <span className="flex-1 min-w-0 text-white/80">{minRad.tekst}</span>
          {minRad.verdi ? (
            <span className={`tabular-nums ${minRad.positiv ? "text-[#93D2A3]" : "text-[#F0A493]"}`}>{minRad.verdi}</span>
          ) : (
            <span className="text-sm font-semibold whitespace-nowrap group-hover:underline underline-offset-4" style={{ color: "hsl(var(--competition))" }}>
              Gå dit
            </span>
          )}
        </Link>
      )}

      <Link
        to="/konkurranse"
        className="knapp-skraa inline-block mt-6 px-8 py-3.5 font-semibold text-[15px] focus-visible:underline underline-offset-4"
        style={{ background: "hsl(var(--competition))", color: "hsl(var(--competition-foreground))" }}
      >
        {deltakerId ? "Gå til konkurransen" : "Bli med i konkurransen"}
      </Link>
    </div>
  );
};

export default KonkurranseKolonne;
