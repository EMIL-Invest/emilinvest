import { divergerende, tekstPaa } from "@/lib/analyse/farger";
import { beloep, sats } from "@/lib/finans/konklusjon";

/**
 * Sensitivitetstabell (kap. 19.5): verdi per aksje for kombinasjoner av
 * WACC og terminalvekst. Cellene farges etter oppside mot dagens kurs -
 * blå under kursen, rød over - så tabellen leses som et kart over hvor
 * konklusjonen holder og hvor den tipper.
 */
interface Props {
  data: { wacc: number[]; vekst: number[]; verdier: number[][] };
  aksjekurs: number;
  valuta: string;
  senterWacc: number;
  senterVekst: number;
}

const Sensitivitet = ({ data, aksjekurs, valuta, senterWacc, senterVekst }: Props) => {
  const maksAvvik = Math.max(
    0.3,
    ...data.verdier.flat().filter(isFinite).map((v) => Math.abs(v / aksjekurs - 1)),
  );
  return (
    <div className="overflow-x-auto">
      <table className="text-xs tabular-nums w-full border-separate" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th className="text-left text-muted-foreground font-normal px-2 py-1">WACC ↓ / vekst →</th>
            {data.vekst.map((g) => (
              <th key={g} className={`px-2 py-1 font-medium ${Math.abs(g - senterVekst) < 1e-9 ? "text-foreground" : "text-muted-foreground"}`}>
                {sats(g, 1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.wacc.map((w, i) => (
            <tr key={w}>
              <th className={`text-left px-2 py-1 font-medium ${Math.abs(w - senterWacc) < 1e-9 ? "text-foreground" : "text-muted-foreground"}`}>{sats(w, 1)}</th>
              {data.vekst.map((g, j) => {
                const v = data.verdier[i][j];
                const opp = isFinite(v) && aksjekurs > 0 ? v / aksjekurs - 1 : NaN;
                const bg = isFinite(opp) ? divergerende(opp / maksAvvik) : "rgb(232,229,223)";
                const erSenter = Math.abs(w - senterWacc) < 1e-9 && Math.abs(g - senterVekst) < 1e-9;
                return (
                  <td
                    key={g}
                    className={`px-2 py-1.5 text-center rounded-sm ${erSenter ? "ring-2 ring-foreground" : ""}`}
                    style={{ background: bg, color: tekstPaa(bg) }}
                    title={isFinite(opp) ? `${beloep(v, valuta, 1)} (${opp >= 0 ? "+" : ""}${(opp * 100).toFixed(0)} %)` : "WACC må være over vekst"}
                  >
                    {isFinite(v) ? beloep(v, "", 0) : "-"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-muted-foreground mt-2">
        Rød = verdi over dagens kurs, blå = under. Rammen markerer basisforutsetningene.
      </p>
    </div>
  );
};

export default Sensitivitet;
