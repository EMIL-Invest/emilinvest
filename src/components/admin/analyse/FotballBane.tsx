import type { Metodeverdi, Samletvurdering } from "@/lib/finans/konklusjon";
import { beloep } from "@/lib/finans/konklusjon";
import { KATEGORI, STATUS } from "@/lib/analyse/farger";

/**
 * «Fotballbanen» - standardfiguren i verdsettelsesrapporter: én
 * horisontal stolpe per metode fra laveste til høyeste anslag, prikk på
 * sentralverdien, og dagens kurs som en loddrett strek. Da ser man med
 * ett blikk om kursen ligger innenfor eller utenfor det modellene sier.
 */
interface Props {
  metoder: Metodeverdi[];
  samlet: Samletvurdering | null;
  aksjekurs: number;
  valuta: string;
  /** Større tekst og mer luft i presentasjonen. */
  stor?: boolean;
}

const FotballBane = ({ metoder, samlet, aksjekurs, valuta, stor }: Props) => {
  const rader = [
    ...metoder.map((m, i) => ({ navn: m.metode, lav: m.lav ?? m.verdi, hoey: m.hoey ?? m.verdi, verdi: m.verdi, farge: KATEGORI[i % KATEGORI.length], dempet: m.vekt === 0 })),
    ...(samlet ? [{ navn: "Samlet anslag", lav: samlet.lav, hoey: samlet.hoey, verdi: samlet.sentralverdi, farge: "#24332C", dempet: false }] : []),
  ].filter((r) => isFinite(r.verdi));
  if (rader.length === 0) return null;

  const alle = rader.flatMap((r) => [r.lav, r.hoey, r.verdi]).concat(aksjekurs).filter(isFinite);
  const min = Math.min(...alle);
  const maks = Math.max(...alle);
  const luft = (maks - min) * 0.12 || maks * 0.1 || 1;
  const x0 = Math.max(0, min - luft);
  const x1 = maks + luft;

  const B = 720;
  const etikettBredde = stor ? 190 : 150;
  const radH = stor ? 44 : 34;
  const H = rader.length * radH + 62;
  const sk = (v: number) => etikettBredde + ((v - x0) / (x1 - x0)) * (B - etikettBredde - 16);
  const fs = stor ? 13 : 11;

  // aksemerker: 5 jevne verdier
  const merker = Array.from({ length: 5 }, (_, i) => x0 + ((x1 - x0) * i) / 4);

  return (
    <svg viewBox={`0 0 ${B} ${H}`} className="w-full h-auto" role="img" aria-label="Verdiintervall per metode mot dagens kurs">
      {merker.map((m) => (
        <g key={m}>
          <line x1={sk(m)} x2={sk(m)} y1={22} y2={H - 30} stroke="#DFDAD1" strokeWidth={1} />
          <text x={sk(m)} y={H - 14} fontSize={fs} textAnchor="middle" fill="#5A6A61">
            {beloep(m, "", 0)}
          </text>
        </g>
      ))}
      {rader.map((r, i) => {
        const y = 30 + i * radH + radH / 2;
        const bh = stor ? 14 : 10;
        return (
          <g key={r.navn} opacity={r.dempet ? 0.45 : 1}>
            <text x={0} y={y + 4} fontSize={fs} fill="#1B2722" fontWeight={r.navn === "Samlet anslag" ? 600 : 400}>
              {r.navn}
            </text>
            <rect x={sk(r.lav)} y={y - bh / 2} width={Math.max(sk(r.hoey) - sk(r.lav), 2)} height={bh} rx={bh / 2} fill={r.farge} fillOpacity={0.28} />
            <circle cx={sk(r.verdi)} cy={y} r={stor ? 6 : 5} fill={r.farge} stroke="#F5F3F0" strokeWidth={2} />
            <text x={sk(r.hoey) + 8} y={y + 4} fontSize={fs - 1} fill="#5A6A61">
              {beloep(r.verdi, "", 0)}
            </text>
          </g>
        );
      })}
      {isFinite(aksjekurs) && aksjekurs > 0 && (
        <g>
          <line x1={sk(aksjekurs)} x2={sk(aksjekurs)} y1={18} y2={H - 30} stroke={STATUS.daarlig} strokeWidth={2} strokeDasharray="5 4" />
          <text x={sk(aksjekurs)} y={12} fontSize={fs} textAnchor="middle" fill={STATUS.daarlig} fontWeight={600}>
            Kurs {beloep(aksjekurs, valuta, 0)}
          </text>
        </g>
      )}
    </svg>
  );
};

export default FotballBane;
