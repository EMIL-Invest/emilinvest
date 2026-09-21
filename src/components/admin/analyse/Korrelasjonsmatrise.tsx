import { divergerende, tekstPaa } from "@/lib/analyse/farger";

/**
 * Korrelasjonsmatrise som varmekart: blå = beveger seg motsatt, grå = uavhengig,
 * rød = i takt. Lav korrelasjon er det som gir diversifiseringsgevinst (kap. 11.2).
 */
const Korrelasjonsmatrise = ({ tickere, matrise }: { tickere: string[]; matrise: number[][] }) => {
  if (tickere.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="text-[11px] tabular-nums border-separate" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th />
            {tickere.map((t) => (
              <th key={t} className="px-1 py-1 font-normal text-muted-foreground" style={{ writingMode: tickere.length > 8 ? "vertical-rl" : undefined }}>
                {t.replace(".OL", "")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickere.map((t, i) => (
            <tr key={t}>
              <th className="text-left pr-2 font-normal text-muted-foreground whitespace-nowrap">{t.replace(".OL", "")}</th>
              {tickere.map((u, j) => {
                const v = matrise[i][j];
                const bg = i === j ? "rgb(36,51,44)" : divergerende(v);
                return (
                  <td
                    key={u}
                    className="w-10 h-8 text-center rounded-sm"
                    style={{ background: bg, color: i === j ? "#F5F3F0" : tekstPaa(bg) }}
                    title={`${t} / ${u}: ${isFinite(v) ? v.toFixed(2) : "-"}`}
                  >
                    {isFinite(v) ? v.toFixed(2).replace("0.", ".").replace("-0.", "-.") : "-"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-muted-foreground mt-2">Blå = motsatt bevegelse, grå = uavhengig, rød = i takt. Jo mer grått og blått, jo mer diversifisering.</p>
    </div>
  );
};

export default Korrelasjonsmatrise;
