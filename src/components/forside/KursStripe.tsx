/**
 * Kurslinjen under menyen: dagens endring for alt porteføljen eier, og til
 * slutt indeksene. Den ruller sakte, pauser ved hover og står stille med
 * «reduser bevegelse» - da kan man sveipe i stedet.
 */

export interface KursPost {
  navn: string;
  endring: number | null;
}

const prosent = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1).replace(".", ",")} %`;

const Rad = ({ poster, skjult }: { poster: KursPost[]; skjult?: boolean }) => (
  <div className="flex shrink-0 gap-7 pr-7" aria-hidden={skjult || undefined}>
    {poster.map((p) => (
      <span key={p.navn} className="whitespace-nowrap">
        <b className="font-semibold text-white mr-1.5">{p.navn}</b>
        {p.endring === null ? (
          <span className="text-white/50">–</span>
        ) : (
          <span className={p.endring >= 0 ? "text-[#93D2A3]" : "text-[#F0A493]"}>{prosent(p.endring)}</span>
        )}
      </span>
    ))}
  </div>
);

const KursStripe = ({ poster }: { poster: KursPost[] }) => {
  if (poster.length === 0) return <div className="h-[38px]" style={{ background: "hsl(var(--band))" }} />;
  return (
    <div className="kursstripe text-[13.5px] text-white/90 overflow-hidden" style={{ background: "hsl(var(--band))" }}>
      <div className="section-container flex items-center h-[38px]">
        <span className="font-semibold mr-6 shrink-0" style={{ color: "hsl(var(--competition))" }}>
          I dag
        </span>
        <div className="kursstripe-vindu flex overflow-hidden">
          <div className="kursstripe-spor flex">
            <Rad poster={poster} />
            <Rad poster={poster} skjult />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KursStripe;
