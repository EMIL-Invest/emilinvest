import {
  CartesianGrid, Label as RLabel, Legend, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, Cell,
} from "recharts";
import type { PortefoljeResultat } from "@/lib/analyse/portefoljeanalyse";
import { KATEGORI, STATUS } from "@/lib/analyse/farger";

/**
 * De to figurene fra kapittel 11 som porteføljeanalysen bygger på:
 *  - Effisient front: volatilitet mot forventet avkastning, med enkeltaksjene,
 *    dagens portefølje og tangentporteføljen (fig. 11.9-11.10).
 *  - Verdipapirmarkedslinjen (SML): beta mot avkastning, CAPM som rett linje;
 *    punkter over linjen har positiv alfa (fig. 12.1 / kap. 13.1).
 *
 * Én y-akse per graf, tynne merker, direkte etiketter på få punkter.
 */

const pst = (v: number) => `${(v * 100).toFixed(0)} %`;
/** Aksemerker i hele 5- eller 10-prosentsteg, aldri flere enn ~7. */
const steg = (lo: number, hi: number): number[] => {
  const s = hi - lo > 0.4 ? 0.1 : 0.05;
  const ut: number[] = [];
  for (let v = Math.ceil(lo / s) * s; v <= hi + 1e-9; v += s) ut.push(+v.toFixed(4));
  return ut;
};
const kort = (t: string) => t.replace(".OL", "");

const TooltipBoks = ({ active, payload }: { active?: boolean; payload?: { payload: Record<string, unknown> }[] }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as { navn: string; x: number; y: number; ekstra?: string };
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="font-medium">{p.navn}</p>
      <p className="text-muted-foreground">{p.ekstra}</p>
    </div>
  );
};

export const EffisientFrontGraf = ({ r, stor }: { r: PortefoljeResultat; stor?: boolean }) => {
  const front = r.front.map((f) => ({ x: f.volatilitet, y: f.forventetAvkastning, navn: "Effisient front", ekstra: `${pst(f.volatilitet)} risiko · ${pst(f.forventetAvkastning)} forventet` }));
  const aksjer = r.posisjoner.map((p, i) => ({
    x: p.volatilitet,
    y: r.parametre.forventetKilde === "capm" ? p.capmKrav : p.historiskAvkastning,
    navn: kort(p.ticker),
    farge: KATEGORI[i % KATEGORI.length],
    ekstra: `Vol ${pst(p.volatilitet)} · forventet ${pst(r.parametre.forventetKilde === "capm" ? p.capmKrav : p.historiskAvkastning)} · vekt ${pst(p.vekt)}`,
  }));
  const spesial = [
    { x: r.portefolje.volatilitet, y: r.portefolje.forventetAvkastning, navn: "Dagens portefølje", farge: "#24332C", form: "circle", ekstra: `Sharpe ${r.portefolje.sharpe.toFixed(2)}` },
    { x: r.tangent.volatilitet, y: r.tangent.forventetAvkastning, navn: "Tangentportefølje", farge: STATUS.advarsel, form: "diamond", ekstra: `Sharpe ${r.tangent.sharpe.toFixed(2)} - best mulig med disse aksjene` },
    { x: r.marked.volatilitet, y: r.parametre.forventetKilde === "capm" ? r.parametre.risikofriRente + r.parametre.markedspremie : r.marked.historiskAvkastning, navn: kort(r.marked.ticker), farge: STATUS.noytral, form: "square", ekstra: "Markedsindeksen" },
  ];
  const alleX = [...front, ...aksjer, ...spesial].map((d) => d.x).filter(isFinite);
  const alleY = [...front, ...aksjer, ...spesial].map((d) => d.y).filter(isFinite);
  const xMaks = Math.max(...alleX, 0.1) * 1.1;
  const yMin = Math.floor((Math.min(0, ...alleY) - 0.01) * 20) / 20;
  const yMaks = Math.ceil((Math.max(...alleY, 0.1) + 0.01) * 20) / 20;
  const yTicks = steg(yMin, yMaks);
  // Kapitalmarkedslinjen: fra r_f gjennom tangentporteføljen
  const kml = [
    { x: 0, y: r.parametre.risikofriRente },
    { x: xMaks, y: r.parametre.risikofriRente + r.tangent.sharpe * xMaks },
  ];

  return (
    <div style={{ height: stor ? 420 : 340 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 24, bottom: 28, left: 8 }}>
          <CartesianGrid strokeDasharray="4 5" stroke="hsl(var(--border))" />
          <XAxis type="number" dataKey="x" domain={[0, xMaks]} tickFormatter={pst} tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))">
            <RLabel value="Risiko (volatilitet per år)" position="insideBottom" offset={-14} fontSize={11} fill="hsl(var(--muted-foreground))" />
          </XAxis>
          <YAxis type="number" dataKey="y" domain={[yMin, yMaks]} ticks={yTicks} tickFormatter={pst} tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" width={48} />
          <ZAxis range={[60, 60]} />
          <Tooltip content={<TooltipBoks />} cursor={{ strokeDasharray: "3 3" }} />
          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 11, paddingBottom: 8 }} />
          <ReferenceLine y={r.parametre.risikofriRente} stroke="#8A7F6A" strokeDasharray="2 4" label={{ value: "Risikofri", position: "insideTopLeft", fontSize: 10, fill: "#8A7F6A" }} />
          <Scatter name="Kapitalmarkedslinje" data={kml} line={{ stroke: STATUS.advarsel, strokeWidth: 1.5, strokeDasharray: "6 4" }} shape={() => <g />} legendType="plainline" fill={STATUS.advarsel} />
          <Scatter name="Effisient front" data={front} line={{ stroke: "#1F8A5C", strokeWidth: 2 }} shape={() => <g />} legendType="plainline" fill="#1F8A5C" />
          <Scatter name="Aksjene" data={aksjer} fill="#2F6FCF" legendType="circle">
            {aksjer.map((a) => <Cell key={a.navn} fill={a.farge} />)}
          </Scatter>
          {spesial.map((s) => (
            <Scatter key={s.navn} name={s.navn} data={[s]} fill={s.farge} shape={s.form as "circle" | "diamond" | "square"} legendType={s.form as "circle" | "diamond" | "square"} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
        {aksjer.map((a) => (
          <span key={a.navn} className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: a.farge }} />{a.navn}</span>
        ))}
      </div>
    </div>
  );
};

export const SmlGraf = ({ r, stor }: { r: PortefoljeResultat; stor?: boolean }) => {
  const rf = r.parametre.risikofriRente;
  const mrp = r.parametre.markedspremie;
  const aksjer = r.posisjoner.map((p, i) => {
    const b = r.parametre.betaVariant === "justert" ? p.betaJustert : p.beta;
    return {
      x: b,
      y: p.historiskAvkastning,
      navn: kort(p.ticker),
      farge: p.alfa >= 0 ? STATUS.god : STATUS.daarlig,
      idx: i,
      ekstra: `β ${b.toFixed(2)} · historisk ${pst(p.historiskAvkastning)} · CAPM-krav ${pst(p.capmKrav)} · alfa ${p.alfa >= 0 ? "+" : ""}${pst(p.alfa)}`,
    };
  });
  const xMaks = Math.max(...aksjer.map((a) => a.x), 1.2) * 1.15;
  const xMin = Math.min(0, ...aksjer.map((a) => a.x)) - 0.1;
  const yVals = aksjer.map((a) => a.y).concat([rf, rf + mrp * xMaks]);
  const yLo = Math.floor((Math.min(...yVals) - 0.02) * 20) / 20;
  const yHi = Math.ceil((Math.max(...yVals) + 0.02) * 20) / 20;
  const sml = [
    { x: xMin, y: rf + mrp * xMin },
    { x: xMaks, y: rf + mrp * xMaks },
  ];
  return (
    <div style={{ height: stor ? 400 : 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 24, bottom: 28, left: 8 }}>
          <CartesianGrid strokeDasharray="4 5" stroke="hsl(var(--border))" />
          <XAxis type="number" dataKey="x" domain={[xMin, xMaks]} tickFormatter={(v: number) => v.toFixed(1)} tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))">
            <RLabel value="Beta (markedsrisiko)" position="insideBottom" offset={-14} fontSize={11} fill="hsl(var(--muted-foreground))" />
          </XAxis>
          <YAxis type="number" dataKey="y" domain={[yLo, yHi]} ticks={steg(yLo, yHi)} tickFormatter={pst} tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" width={48} />
          <ZAxis range={[70, 70]} />
          <Tooltip content={<TooltipBoks />} cursor={{ strokeDasharray: "3 3" }} />
          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 11, paddingBottom: 8 }} />
          <ReferenceLine x={1} stroke="#8A7F6A" strokeDasharray="2 4" label={{ value: "Markedet", position: "insideTopRight", fontSize: 10, fill: "#8A7F6A" }} />
          <Scatter name="CAPM-linjen (krav)" data={sml} line={{ stroke: "#24332C", strokeWidth: 2 }} shape={() => <g />} legendType="plainline" fill="#24332C" />
          <Scatter name="Over kravet (positiv alfa)" data={aksjer.filter((a) => a.farge === STATUS.god)} fill={STATUS.god} />
          <Scatter name="Under kravet (negativ alfa)" data={aksjer.filter((a) => a.farge === STATUS.daarlig)} fill={STATUS.daarlig} />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
        {aksjer.map((a) => (
          <span key={a.navn} className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: a.farge }} />{a.navn} β {a.x.toFixed(2)}</span>
        ))}
      </div>
    </div>
  );
};
