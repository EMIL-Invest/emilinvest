import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { VerdsettelseInputs, VerdsettelseResultater } from "@/lib/analyse/verdsettelse";
import { ANBEFALING_TEKST, beloep, forklarVurdering, prosent, sats } from "@/lib/finans/konklusjon";
import FotballBane from "./FotballBane";

/**
 * «Vis for komiteen» - presentasjonsvisningen. Ingen tabeller, ingen
 * fagord uten forklaring. Én konklusjon, én figur, tre tall med «hva
 * betyr dette», og analytikerens egne ord. Alt annet ligger i ekspertvisningen.
 */
interface Props {
  open: boolean;
  onClose: () => void;
  inn: VerdsettelseInputs;
  res: VerdsettelseResultater;
}

const Kort = ({ tittel, verdi, forklaring }: { tittel: string; verdi: string; forklaring: string }) => (
  <div className="rounded-md border border-border bg-card p-5">
    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{tittel}</p>
    <p className="font-serif text-3xl tabular-nums mt-1 text-foreground">{verdi}</p>
    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{forklaring}</p>
  </div>
);

const PresentasjonVerdsettelse = ({ open, onClose, inn, res }: Props) => {
  const s = res.samlet;
  const v = inn.valuta;
  const farge = s ? (s.anbefaling === "kjop" ? "bg-emerald-700" : s.anbefaling === "selg" ? "bg-red-700" : "bg-stone-600") : "bg-stone-600";
  const handling = s ? (s.anbefaling === "kjop" ? "Kandidat for kjøp" : s.anbefaling === "selg" ? "Vurder å selge eller trimme" : "Behold - ingen grunn til å handle") : "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 bg-background">
        <DialogTitle className="sr-only">Verdsettelse for komiteen</DialogTitle>
        <div className="p-8 md:p-12">
          <p className="eyebrow mb-3">Verdsettelse · {new Date(res.beregnet).toLocaleDateString("no-NO", { day: "numeric", month: "long", year: "numeric" })}</p>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">{inn.selskapsnavn || inn.ticker}</h2>
          <p className="text-muted-foreground mt-1">{inn.ticker} · kurs {beloep(inn.aksjekurs, v, 2)}</p>

          {s ? (
            <>
              <div className={`mt-8 rounded-md ${farge} text-white p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center`}>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/70">Vår vurdering</p>
                  <p className="font-serif text-4xl md:text-5xl mt-1">{ANBEFALING_TEKST[s.anbefaling].tittel}</p>
                  <p className="text-white/85 mt-2 text-lg">{ANBEFALING_TEKST[s.anbefaling].kort} {handling}.</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/70">Vi mener aksjen er verdt</p>
                  <p className="font-serif text-5xl tabular-nums mt-1">{beloep(s.sentralverdi, v, 0)}</p>
                  <p className="text-white/85 mt-1 text-lg">{prosent(s.oppside)} mot dagens kurs</p>
                </div>
              </div>

              <div className="mt-8 rounded-md border border-border bg-card p-5">
                <p className="text-sm font-medium mb-1">Hva de ulike metodene sier</p>
                <p className="text-xs text-muted-foreground mb-4">Hver stolpe er spennet fra laveste til høyeste anslag i én metode. Den røde streken er dagens kurs. Ligger streken til venstre for prikkene, sier modellene at aksjen er billig.</p>
                <FotballBane metoder={res.metoder} samlet={s} aksjekurs={inn.aksjekurs} valuta={v} stor />
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <Kort
                  tittel="Avkastningskrav"
                  verdi={sats(res.waccBrukt)}
                  forklaring={`Så mye må selskapet tjene på pengene sine hvert år for at investeringen skal være verdt risikoen. Kravet bygger på at aksjen svinger ${res.beta >= 1.1 ? "mer" : res.beta <= 0.9 ? "mindre" : "omtrent like mye"} som børsen (beta ${res.beta.toFixed(2)}).`}
                />
                <Kort
                  tittel="Sikkerhetsmargin"
                  verdi={sats(s.sikkerhetsmargin)}
                  forklaring={s.sikkerhetsmargin > 0 ? "Så mye kan anslaget vårt være for høyt før vi betaler mer enn aksjen er verdt. Jo større, jo tryggere kjøp." : "Kursen er høyere enn anslaget vårt. Markedet venter seg mer av selskapet enn vi gjør."}
                />
                <Kort
                  tittel="Usikkerhet"
                  verdi={`${beloep(s.lav, "", 0)} - ${beloep(s.hoey, "", 0)}`}
                  forklaring="Spennet mellom det mest pessimistiske og det mest optimistiske anslaget. Verdsettelse er ikke eksakt - små endringer i vekst og krav flytter tallet mye."
                />
              </div>

              {res.scenarioer && (
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {res.scenarioer.map((sc) => (
                    <div key={sc.navn} className="rounded-md border border-border bg-card p-4 text-center">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{sc.navn}</p>
                      <p className="font-serif text-2xl tabular-nums mt-1">{beloep(sc.verdiPerAksje, v, 0)}</p>
                      <p className={`text-sm ${sc.oppside >= 0 ? "stock-positive" : "stock-negative"}`}>{prosent(sc.oppside)}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 space-y-3">
                {forklarVurdering(s, inn.aksjekurs, v).map((t, i) => (
                  <p key={i} className="text-base leading-relaxed text-foreground">{t}</p>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-8 text-muted-foreground">Ingen konklusjon ennå - fyll inn en metode i ekspertvisningen.</p>
          )}

          {inn.notat && (
            <div className="mt-8 rounded-md bg-card border border-border p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-2">Analytikerens vurdering</p>
              <p className="whitespace-pre-line leading-relaxed">{inn.notat}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-10 leading-relaxed border-t border-border pt-4">
            Internt arbeidsdokument for EMIL Invest. Modellene bygger på forutsetninger analytikeren har valgt, og tallene er anslag med stor usikkerhet. Dette er ikke investeringsrådgivning.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PresentasjonVerdsettelse;
