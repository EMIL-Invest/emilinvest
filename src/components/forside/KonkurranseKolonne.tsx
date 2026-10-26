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

  let minRad: { tekst: string; lenke: string } | null = null;
  if (!laster) {
    if (min && min.kvalifisert && min.plass !== null && !erPaaToppen)
      minRad = { tekst: `Du er nr. ${min.plass} av ${min.antallRangerte} med ${prosent(min.avkastning)}`, lenke: "Se porteføljen" };
    else if (min && !min.kvalifisert) {
      const mangler = KRAV_ANTALL_AKSJER - min.antallAksjer;
      minRad = { tekst: `Du mangler ${mangler} ${mangler === 1 ? "aksje" : "aksjer"} for å bli rangert`, lenke: "Fullfør porteføljen" };
    } else if (innlogget && !deltakerId) minRad = { tekst: "Du er ikke med ennå", lenke: "Bli med" };
  }

  return (
    <div className="border-t-2 pt-6" style={{ borderColor: "hsl(var(--competition))" }}>
      <h2 className="font-serif text-4xl md:text-[44px] leading-[1.05] text-white">Aksjekonkurransen</h2>
      <p className="text-[16.5px] leading-relaxed text-white/75 mt-3 mb-6 max-w-md">
        Start med 100 000 kr i virtuell kapital, bygg din egen portefølje og se om du slår oss. Beste
        avkastning hver måned vinner premie.
      </p>

      <div className="flex justify-between text-sm text-white/55 mb-1">
        <span>Ledere i {maaned}</span>
        <span>avkastning</span>
      </div>
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
            <li key={t.id} className="flex gap-3.5 py-[11px] border-t border-white/15 text-[15px] text-white">
              <span className="w-3.5 tabular-nums" style={i === 0 ? { color: "hsl(var(--competition))" } : { opacity: 0.6 }}>
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
        <p className="flex items-center justify-between gap-4 border-t border-dashed border-white/25 pt-3 text-sm text-white/75">
          <span>{minRad.tekst}</span>
          <Link to="/konkurranse" className="font-semibold whitespace-nowrap hover:underline underline-offset-4" style={{ color: "hsl(var(--competition))" }}>
            {minRad.lenke}
          </Link>
        </p>
      )}

      <Link
        to="/konkurranse"
        className="knapp-skraa inline-block mt-6 px-8 py-3.5 font-semibold text-[15px] transition-[filter] hover:brightness-105 focus-visible:underline underline-offset-4"
        style={{ background: "hsl(var(--competition))", color: "hsl(var(--competition-foreground))" }}
      >
        Bli med i konkurransen
      </Link>
    </div>
  );
};

export default KonkurranseKolonne;
