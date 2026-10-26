import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Kurven mellom toppen og det grønne feltet på forsiden. Overgangen fra lys
 * bakgrunn til grønt ER porteføljens utvikling, med gul kant. Valgt indeks
 * ligger som en svak «fjellrygg» oppå, synlig både der vi ligger foran og bak.
 *
 * Skalaen tilpasser seg alltid perioden: høyeste og laveste punkt for portefølje
 * og indeks havner innenfor sonen. Kurven kan derfor aldri vokse inn i bildet
 * over eller teksten under, uansett hvor kraftig kursene går.
 */

export interface KurvePunkt {
  d: string;
  /** Verdi normalisert til 100 ved periodens start. */
  v: number;
}

interface Props {
  portefolje: KurvePunkt[];
  /** Valgt indeks, normalisert og på samme datoer som porteføljen. Tom = ingen indeks. */
  indeks: number[];
  /** Etiketten ved kurvens ende, f.eks. «−3,7 %». */
  etikett: string;
  undertekst: string;
}

const PAD = 26;
const VARIGHET_MS = 800;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface Tilstand {
  indeks: number[];
  mn: number;
  mx: number;
}

const maal = (p: number[], b: number[]): Tilstand => {
  const alle = b.length ? [...p, ...b] : p;
  return { indeks: b, mn: Math.min(...alle), mx: Math.max(...alle) };
};

const Kurve = ({ portefolje, indeks, etikett, undertekst }: Props) => {
  const boksRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const [str, setStr] = useState({ w: 0, h: 0 });
  const p = portefolje.map((x) => x.v);
  const [tilstand, setTilstand] = useState<Tilstand>(() => maal(p, indeks));
  const forrige = useRef<Tilstand>(tilstand);
  const anim = useRef(0);

  // Mål størrelsen på sonen - SVG-en tegnes i ekte piksler så streken holder tykkelsen.
  useLayoutEffect(() => {
    const el = boksRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStr({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setStr({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Bytte av indeks: ingen omlasting - linjen og skalaen glir over til de nye
  // verdiene. Med «reduser bevegelse» på i systemet byttes det rett over.
  const pNoekkel = p.join(",");
  const bNoekkel = indeks.join(",");
  useEffect(() => {
    const til = maal(p, indeks);
    const fra = forrige.current;
    const kanGli = fra.indeks.length === til.indeks.length && fra.indeks.length > 0;
    const redusert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cancelAnimationFrame(anim.current);
    if (!kanGli || redusert) {
      forrige.current = til;
      setTilstand(til);
      return;
    }
    const t0 = performance.now();
    const steg = (naa: number) => {
      const t = Math.min((naa - t0) / VARIGHET_MS, 1);
      const e = easeInOut(t);
      const mellom: Tilstand = {
        indeks: fra.indeks.map((v, i) => v + (til.indeks[i] - v) * e),
        mn: fra.mn + (til.mn - fra.mn) * e,
        mx: fra.mx + (til.mx - fra.mx) * e,
      };
      forrige.current = mellom;
      setTilstand(mellom);
      if (t < 1) anim.current = requestAnimationFrame(steg);
    };
    anim.current = requestAnimationFrame(steg);
    return () => cancelAnimationFrame(anim.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pNoekkel, bNoekkel]);

  const { w: W, h: H } = str;
  const n = p.length;
  const klar = W > 0 && n > 1;
  const { mn, mx } = tilstand;
  const x = (i: number) => (i * W) / (n - 1);
  const y = (v: number) => PAD + ((mx - v) * (H - 2 * PAD)) / (mx - mn || 1);
  const linje = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const b = tilstand.indeks;

  // Etiketten legges over eller under kurven der det er plass. Vi ser på hele
  // bredden den dekker, så den aldri krysser linjen. Over linjen er bakgrunnen
  // lys (mørk tekst), under er den grønn (lys tekst).
  const [tagStr, setTagStr] = useState({ w: 180, h: 44 });
  useLayoutEffect(() => {
    if (tagRef.current) setTagStr({ w: tagRef.current.offsetWidth, h: tagRef.current.offsetHeight });
  }, [etikett, undertekst, W]);
  let tag = { left: 0, top: 0, over: true };
  if (klar) {
    const hoyre = W > 1280 ? (W - 1280) / 2 + 1280 - 32 : W - (W < 640 ? 16 : 32);
    const ys = p.map((v, i) => [x(i), y(v)]).filter(([xx]) => xx >= hoyre - tagStr.w - 10 && xx <= hoyre + 20).map((a) => a[1]);
    const topp = Math.min(...ys);
    const bunn = Math.max(...ys);
    const plassOver = topp - 12 - tagStr.h >= 0;
    const plassUnder = bunn + 12 + tagStr.h <= H;
    const over = plassOver && (!plassUnder || topp >= H - bunn);
    tag = { left: hoyre, top: over ? topp - 12 - tagStr.h : bunn + 12, over };
  }

  return (
    <div ref={boksRef} className="relative h-[170px] md:h-[240px]" aria-hidden="true">
      {klar && (
        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            {b.length > 0 && (
              <linearGradient
                id="indeks-tone"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1={Math.min(...b.map(y))}
                x2="0"
                y2={Math.max(...b.map(y)) + 46}
              >
                <stop offset="0" stopColor="#6E9276" stopOpacity="0.22" />
                <stop offset="1" stopColor="#6E9276" stopOpacity="0" />
              </linearGradient>
            )}
            <clipPath id="kurve-sone">
              <rect x="0" y="0" width={W} height={H} />
            </clipPath>
          </defs>
          <path d={`${linje(p)} L${W} ${H + 2} L0 ${H + 2} Z`} fill="hsl(var(--band))" />
          {b.length > 0 && (
            <>
              <g clipPath="url(#kurve-sone)">
                <path d={`${linje(b)} L${W} ${H + 40} L0 ${H + 40} Z`} fill="url(#indeks-tone)" />
              </g>
              <path d={linje(b)} fill="none" stroke="#86A38B" strokeOpacity="0.75" strokeWidth="1.25" />
            </>
          )}
          <path d={linje(p)} fill="none" stroke="hsl(var(--competition))" strokeWidth="3" strokeLinejoin="round" />
          <circle cx={W - 4} cy={y(p[n - 1])} r="5" fill="hsl(var(--competition))" />
        </svg>
      )}
      <div
        ref={tagRef}
        className={`absolute -translate-x-full text-right whitespace-nowrap transition-colors duration-300 ${
          tag.over ? "text-primary" : "text-white"
        } ${klar ? "" : "invisible"}`}
        style={{ left: tag.left, top: tag.top }}
      >
        <span className="block font-serif text-lg md:text-[22px] leading-tight">{etikett}</span>
        <span className="block text-[12.5px] opacity-75">{undertekst}</span>
      </div>
    </div>
  );
};

export default Kurve;
